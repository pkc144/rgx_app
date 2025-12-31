// PerformanceChart.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import server from '../../utils/serverConfig';
import { BarChart2 } from 'lucide-react-native';
import { useTrade } from '../../screens/TradeContext';

const PerformanceChart = ({ modelName }) => {
  const {configData}=useTrade();
  const [selectedIndex, setSelectedIndex] = useState('^NSEI');
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // selectedPoint holds the clicked point info and coordinates
  const [selectedPoint, setSelectedPoint] = useState(null);
  // Example: { index: 5, datasetIndex: 0, x: 120, y: 90, portfolio: 101.23, nifty: 99.88, date: '2025-01-01' }

  const fetchIndexData = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endDate = tomorrow.toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await fetch(
        `${server.ccxtServer.baseUrl}misc/data-fetcher?symbol=${selectedIndex}&start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'X-Advisor-Subdomain':  configData?.config?.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET
            ),
          },
        }
      );
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error fetching index data:', err);
      return [];
    }
  };

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch(
        `${server.ccxtServer.baseUrl}rebalance/v2/get-portfolio-performance`,
        {
          method: 'POST',
          body: JSON.stringify({
            advisor:  configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
            modelName,
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain':  configData?.config?.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET
            ),
          },
        }
      );

      if (!response.ok) {
        console.error(`API error: ${response.status} ${response} ${modelName}` );
        return [];
      }

      const data = await response.json();

      if (data.status === 0 && data.message === 'No performance data found.') {
        console.info('No performance data available for this portfolio');
        return [];
      }

      return data.data || [];
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSelectedPoint(null); // clear selection when reloading

    try {
      const [portfolio, indexData] = await Promise.all([
        fetchPortfolioData(),
        fetchIndexData(),
      ]);

      if (!portfolio?.length || !indexData?.length) {
        setPortfolioData([]);
        setLoading(false);
        return;
      }

      const portfolioDates = portfolio.map((p) =>
        new Date(p.date).toISOString().split('T')[0]
      );
      const startDate = portfolioDates[0];

      const firstPortfolioValue =
        portfolio.find(
          (p) => new Date(p.date).toISOString().split('T')[0] === startDate
        )?.value || 100;

      const firstIndexValue =
        indexData.find(
          (n) => new Date(n.Date).toISOString().split('T')[0] === startDate
        )?.Close || 100;

      const alignedData = (portfolio || [])
        .map((p) => {
          const pDate = new Date(p.date).toISOString().split('T')[0];
          const matchingIndex = indexData.find(
            (n) => new Date(n.Date).toISOString().split('T')[0] === pDate
          );

          return {
            date: pDate,
            portfolioValue: (p.value / firstPortfolioValue) * 100,
            indexValue: matchingIndex
              ? (matchingIndex.Close / firstIndexValue) * 100
              : null,
            actualIndexValue: matchingIndex?.Close || null,
            actualPortfolioValue: p.value,
          };
        })
        .filter((d) => d.indexValue !== null)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setPortfolioData(alignedData);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedIndex, modelName]);

  if (loading) return <ActivityIndicator size="large" color="#0070D0" />;
  if (error)
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: '#D00' }}>{error}</Text>
      </View>
    );
  if (!portfolioData.length)
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          marginTop: 40,
        }}
      >
        <BarChart2 size={48} color="#888" style={{ marginBottom: 16 }} />
        <Text
          style={{
            color: '#000',
            fontFamily: 'Poppins-SemiBold',
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          No performance data available
        </Text>
        <Text
          style={{
            color: '#666',
            fontFamily: 'Poppins-Regular',
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 280,
          }}
        >
          We couldn’t find any data for this model. Please try again later or
          select a different model.
        </Text>
      </View>
    );

  const portfolioValues = portfolioData.map((d) => d.portfolioValue);
  const indexValues = portfolioData.map((d) => d.indexValue);

  const portfolioMin = Math.min(...portfolioValues);
  const portfolioMax = Math.max(...portfolioValues);
  const indexMin = Math.min(...indexValues);
  const indexMax = Math.max(...indexValues);

  const chartWidth = Dimensions.get('window').width * 2.2; // scrollable width
  const chartHeight = 280;
  const tooltipWidth = 140;
  const highlightSize = 12;

  return (
    <View style={{ paddingHorizontal: 10 }}>
      <Text
        style={{
          fontFamily: 'Satoshi-Bold',
          fontSize: 16,
          marginBottom: 10,
          color: '#000',
        }}
      >
        Portfolio vs {selectedIndex === '^NSEI' ? 'Nifty' : selectedIndex}
      </Text>

      <Text
        style={{
          fontFamily: 'Poppins-Regular',
          fontSize: 12,
          marginBottom: 10,
          color: '#000',
        }}
      >
        This is a simulated portfolio based on the model portfolio rebalances.
        If you wish to execute the model portfolio in this platform and see
        live performance,
      </Text>

      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          elevation: 2,
          paddingVertical: 10,
          paddingHorizontal: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          onScrollBeginDrag={() => {
            // hide selection while user scrolls so highlight doesn't get out of sync
            setSelectedPoint(null);
          }}
        >
          <View
            style={{
              height: chartHeight + 30, // leave room for labels under chart
              overflow: 'visible',
              marginVertical: 8,
              borderRadius: 12,
            }}
          >
            <LineChart
              data={{
                labels: portfolioData.map((d, i) => {
                  const interval = Math.floor(portfolioData.length / 6) || 1;
                  if (i % interval === 0 || i === portfolioData.length - 1)
                    return new Date(d.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    });
                  return '';
                }),
                datasets: [
                  {
                    data: portfolioValues,
                    color: (opacity = 1) => `rgba(7, 186, 209, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: indexValues,
                    color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
                legend: ['Portfolio', 'Nifty'],
              }}
              width={chartWidth}
              height={chartHeight}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                labelColor: (opacity = 1) => `rgba(120,120,120,${opacity})`,
                propsForDots: { r: '3', strokeWidth: '1.5', stroke: '#fff' },
                propsForBackgroundLines: { stroke: 'rgba(0,0,0,0.06)' },
              }}
              bezier
              withInnerLines
              withOuterLines={false}
              yLabelsOffset={10}
              style={{ borderRadius: 12 }}
              // Capture click and use the x/y returned to position overlay highlight + tooltip
              onDataPointClick={(data) => {
                // data: { value, datasetIndex, index, x, y }
                const idx = data.index;
                const ds = data.datasetIndex ?? 0;
                const x = Number(data.x);
                const y = Number(data.y);
                const date = portfolioData[idx]?.date || '';

                const pointInfo = {
                  index: idx,
                  datasetIndex: ds,
                  x,
                  y,
                  portfolio: portfolioData[idx]?.portfolioValue ?? null,
                  nifty: portfolioData[idx]?.indexValue ?? null,
                  date,
                };

                // toggle if clicking same point again
                if (
                  selectedPoint &&
                  selectedPoint.index === pointInfo.index &&
                  selectedPoint.datasetIndex === pointInfo.datasetIndex
                ) {
                  setSelectedPoint(null);
                } else {
                  setSelectedPoint(pointInfo);
                }
              }}
            />

            {/* Highlight dot (absolute overlay) */}
            {selectedPoint && (
              <>
                <View
                  style={{
                    position: 'absolute',
                    left: Math.max(
                      0,
                      Math.min(
                        chartWidth - highlightSize,
                        selectedPoint.x - highlightSize / 2
                      )
                    ),
                    top: Math.max(0, selectedPoint.y+40 - highlightSize / 2),
                    width: highlightSize,
                    height: highlightSize,
                    borderRadius: highlightSize / 2,
                    backgroundColor:
                      selectedPoint.datasetIndex === 0 ? '#07d118ff' : '#FF6347',
                    borderWidth: 2,
                    borderColor: '#fff',
                    zIndex: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 3,
                    elevation: 4,
                  }}
                />

                {/* Tooltip box */}
                <View
                  style={{
                    position: 'absolute',
                    // center tooltip above the point but clamp inside chart width
                    left: Math.max(
                      8,
                      Math.min(
                        chartWidth - tooltipWidth - 8,
                        selectedPoint.x - tooltipWidth / 2
                      )
                    ),
                    top:
                      selectedPoint.y - 70 > 0
                        ? selectedPoint.y - 70
                        : selectedPoint.y + 12,
                    width: tooltipWidth,
                    backgroundColor: '#000',
                    padding: 8,
                    borderRadius: 8,
                    zIndex: 30,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, marginBottom: 4 }}>
                    {new Date(selectedPoint.date).toLocaleDateString('en-IN')}
                  </Text>
                  <Text style={{ color: '#07BAD1', fontSize: 13, fontWeight: '700' }}>
                    Portfolio: {selectedPoint.portfolio?.toFixed(2)}
                  </Text>
                  <Text style={{ color: '#FF6347', fontSize: 13, fontWeight: '700' }}>
                    Nifty: {selectedPoint.nifty?.toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 15,
          flexWrap: 'wrap',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 10,
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#07BAD1',
              marginRight: 6,
              borderRadius: 20,
            }}
          />
          <Text style={{ color: '#000', fontFamily: 'Satoshi-Medium', fontSize: 13 }}>
            Portfolio
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 10,
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              backgroundColor: '#FF6347',
              marginRight: 6,
              borderRadius: 20,
            }}
          />
          <Text style={{ color: '#000', fontFamily: 'Satoshi-Medium', fontSize: 13 }}>
            {selectedIndex === '^NSEI' ? 'Nifty' : selectedIndex}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PerformanceChart;
