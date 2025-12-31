import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { XIcon, FileText, Search, ExternalLink, RefreshCw, Filter, ArrowLeft, Calendar, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import server from '../../utils/serverConfig';
import { generateToken } from '../../utils/SecurityTokenManager';
import Config from 'react-native-config';
import { getAuth } from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';
import { useTrade } from '../TradeContext';

const ResearchReportScreen = () => {
  const {configData}=useTrade();
  const navigation = useNavigation();
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [symbolsWithLTP, setSymbolsWithLTP] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingRowIndex, setLoadingRowIndex] = useState(null);
  const [webViewLoading, setWebViewLoading] = useState(false);
  const [shouldLoadPdf, setShouldLoadPdf] = useState(false);

  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [filteredSymbols, setFilteredSymbols] = useState([]);

  // Sort states
  const [sortOrder, setSortOrder] = useState('latest');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  useEffect(() => {
    if (userEmail) {
      fetchAvailableResearchReports();
    }
  }, [userEmail]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, startDate, endDate, symbolsWithLTP, sortOrder]);

  const applyFilters = () => {
    let filtered = symbolsWithLTP;
    if (searchQuery && searchQuery.trim() !== '') {
      filtered = filtered.filter(symbol =>
        symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (startDate || endDate) {
      filtered = filtered.filter(symbol => {
        if (!symbol.lastTradeDate) return true;
        const tradeDate = new Date(symbol.lastTradeDate);
        if (startDate) {
          const startDateTime = new Date(startDate);
          startDateTime.setHours(0, 0, 0, 0);
          if (tradeDate < startDateTime) return false;
        }
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          if (tradeDate > endDateTime) return false;
        }
        return true;
      });
    }
    filtered.sort((a, b) => {
      if (!a.lastTradeDate || !b.lastTradeDate) return 0;
      const dateA = new Date(a.lastTradeDate);
      const dateB = new Date(b.lastTradeDate);
      return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
    setFilteredSymbols(filtered);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const toggleDateFilter = () => {
    setIsDateFilterOpen(!isDateFilterOpen);
  };

  const toggleSortMenu = () => {
    setIsSortMenuOpen(!isSortMenuOpen);
  };

  const setSorting = (order) => {
    setSortOrder(order);
    setIsSortMenuOpen(false);
  };

  const fetchAvailableResearchReports = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-Advisor-Subdomain": configData?.config?.REACT_APP_HEADER_NAME,
        "aq-encrypted-key": generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET
        ),
      };
      const tradeHistoryResponse = await fetch(`${server.server.baseUrl}api/trade-history/range-trades`, {
        method: "POST",
        headers,
        body: JSON.stringify({ userEmail }),
      });
      if (!tradeHistoryResponse.ok) {
        throw new Error(`Failed to fetch trade history: ${tradeHistoryResponse.status}`);
      }
      const data = await tradeHistoryResponse.json();
      let tradesData = [];
      if (Array.isArray(data)) {
        tradesData = data;
      } else if (data && typeof data === "object") {
        if (data.trades && Array.isArray(data.trades)) {
          tradesData = data.trades;
        } else if (data.data && Array.isArray(data.data)) {
          tradesData = data.data;
        } else {
          tradesData = [data];
        }
      }
      const tradedSymbols = [...new Set(
        tradesData
          .filter(trade => trade.exchange === "NSE")
          .map(trade => trade.symbol)
      )];
      const symbolsWithInfo = tradedSymbols.map(symbol => {
        const trades = tradesData.filter(trade =>
          trade.symbol === symbol
        );
        const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
        return {
          symbol: symbol,
          name: getCompanyName(symbol.replace('-EQ', '')),
          totalTrades: trades.length,
          lastTradeDate: lastTrade ? new Date(lastTrade.date) : null,
          buyTrades: trades.filter(t => t.type === 'BUY').length,
          sellTrades: trades.filter(t => t.type === 'SELL').length,
          exchange: 'NSE',
          hasResearchReport: false,
          reportLink: null,
          ltp: lastTrade ? lastTrade.ltp : null, // Show Last Traded Price if available
        };
      });
      setAvailableSymbols(symbolsWithInfo);
      setSymbolsWithLTP(symbolsWithInfo);
    } catch (error) {
      setAvailableSymbols([]);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (symbol) => {
    const companyNames = { /* unchanged mapping ... */ };
    return companyNames[symbol] || symbol;
  };

  const handleOpenResearchReport = async (symbol) => {
    setLoadingRowIndex(symbol);
    try {
      const advisorTag = configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG || '';
      const url = `${server.ccxtServer.baseUrl}comms/research-report-link/${advisorTag}/${symbol}`;
      const headers = {
        "Content-Type": "application/json",
        "X-Advisor-Subdomain": configData?.config?.REACT_APP_HEADER_NAME,
        "aq-encrypted-key": generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET
        ),
      };
      const response = await fetch(url, { method: "GET", headers });
      if (response.status === 404) {
        alert('No research report available for this trade');
        setLoadingRowIndex(null);
        return;
      }
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 0 && data.link) {
        setSelectedPdfUrl(data.link);
        setShowPdfModal(true);
        setShouldLoadPdf(true);
      } else if (data.status === 1) {
        alert(data.message || 'No research report available for this trade');
      } else {
        alert('No research report available for this trade');
      }
    } catch (err) {
      alert('No research report available for this trade');
    } finally {
      setLoadingRowIndex(null);
    }
  };

  // Determine dynamic month text
  const getMonthText = () => {
    if (!filteredSymbols.length) return '--';
    const mostRecent = filteredSymbols[0].lastTradeDate;
    if (!mostRecent) return '--';
    return mostRecent.toLocaleDateString('en-US', { month: 'short' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient   colors={['rgba(0, 38, 81, 1)', 'rgba(0, 86, 183, 1)']} 
        start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
   style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <ChevronLeft size={24} color="#000" /> 
    </TouchableOpacity>
          <Text style={styles.headerTitle}>Research Report</Text>
        </View>
      </LinearGradient>

      {/* Search & Date Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color="#98AEC7" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by names, price"
            placeholderTextColor="#A9B6D2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.sortButton} onPress={toggleSortMenu}>
            <Filter size={18} color="#93AAD2" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.dateFilterBtn} onPress={toggleDateFilter}>
          <Calendar size={17} color="#fff" />
          <Text style={styles.dateFilterText}>Date</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter Modal */}
      <Modal
        visible={isDateFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={toggleDateFilter}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateFilterPanel}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
              placeholderTextColor="#999"
            />
            <Text style={styles.dateLabel}>End Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
              placeholderTextColor="#999"
            />
            <View style={styles.dateFilterActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearDateFilter}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={toggleDateFilter}>
                <Text style={styles.closeButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Menu */}
      {isSortMenuOpen && (
        <View style={styles.sortMenu}>
          <TouchableOpacity
            style={[styles.sortOption, sortOrder === 'latest' && styles.sortOptionActive]}
            onPress={() => setSorting('latest')}
          >
            <Text style={[styles.sortOptionText, sortOrder === 'latest' && styles.sortOptionTextActive]}>
              Latest First
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortOrder === 'oldest' && styles.sortOptionActive]}
            onPress={() => setSorting('oldest')}
          >
            <Text style={[styles.sortOptionText, sortOrder === 'oldest' && styles.sortOptionTextActive]}>
              Oldest First
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Filters Display */}
      {(startDate || endDate || sortOrder !== 'latest') && (
        <ScrollView 
          horizontal
  style={{ maxHeight: 40 }}
  contentContainerStyle={{ alignItems: 'center' }}
  showsHorizontalScrollIndicator={false}
  >

          {startDate ? (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>From: {startDate}</Text>
            </View>
          ) : null}
          {endDate ? (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>To: {endDate}</Text>
            </View>
          ) : null}
          {sortOrder !== 'latest' ? (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Sorted: {sortOrder}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* Section Label */}
      <View style={styles.sectionLabel}>
        <Text style={styles.monthLabel}>{getMonthText()}</Text>
        <Text style={styles.reportsLabel}>{filteredSymbols.length} Reports</Text>
      </View>

      {/* Table Rows */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#407BFF" />
            <Text style={styles.loadingText}>Loading research reports...</Text>
          </View>
        ) : filteredSymbols.length > 0 ? (
          filteredSymbols.map((symbol, idx) => (
            <View style={styles.reportCard} key={idx}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportSymbol}>
                  {symbol.symbol} <Text style={styles.reportNSE}>({symbol.exchange})</Text>
                </Text>
                <Text style={styles.reportLTP}>
                  LTP : <Text style={{ fontWeight: '700' }}>{symbol.ltp || '--'}</Text>
                </Text>
              </View>
              <View style={styles.reportCenter}>
                <View
                  style={[
                    styles.tradeChip,
                    symbol.buyTrades > symbol.sellTrades
                      ? styles.buyChip
                      : symbol.buyTrades < symbol.sellTrades
                      ? styles.sellChip
                      : styles.mixedChip,
                  ]}
                >
                  <Text
                    style={[
                      styles.tradeChipText,
                      symbol.buyTrades > symbol.sellTrades
                        ? styles.buyChipText
                        : symbol.buyTrades < symbol.sellTrades
                        ? styles.sellChipText
                        : styles.mixedChipText,
                    ]}
                  >
                    {symbol.buyTrades > symbol.sellTrades
                      ? 'Buy'
                      : symbol.buyTrades < symbol.sellTrades
                      ? 'Sell'
                      : 'Mixed'}
                  </Text>
                </View>
                <Text style={styles.reportDate}>
                  {symbol.lastTradeDate
                    ? symbol.lastTradeDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }) +
                      ' ' +
                      symbol.lastTradeDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      })
                    : 'N/A'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.reportRight}
                onPress={() => handleOpenResearchReport(symbol.symbol)}
                disabled={loadingRowIndex === symbol.symbol}
              >
                {loadingRowIndex === symbol.symbol ? (
                  <ActivityIndicator size="small" color="#045DFF" />
                ) : (
                  <ExternalLink size={18} color="#045DFF" />
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {symbolsWithLTP.length > 0 ? 'No Results Found' : 'No Research Reports Available'}
            </Text>
            <Text style={styles.emptyDescription}>
              {symbolsWithLTP.length > 0
                ? 'Try adjusting your search or date filters.'
                : 'Research reports will appear here when available.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* PDF Modal */}
      <Modal
        visible={showPdfModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPdfModal(false);
          setSelectedPdfUrl('');
          setWebViewLoading(false);
          setShouldLoadPdf(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowPdfModal(false);
                setSelectedPdfUrl('');
                setWebViewLoading(false);
                setShouldLoadPdf(false);
              }}
            >
              <XIcon size={24} color="#222" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Research Report</Text>
          </View>
          {shouldLoadPdf && selectedPdfUrl ? (
            <WebView
              source={{ uri: selectedPdfUrl }}
              style={styles.webView}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
            />
          ) : (
            <View style={styles.pdfLoadingContainer}>
              <ActivityIndicator size="large" color="#407BFF" />
              <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8FE' },
  headerGradient: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 10,
    paddingTop: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
  },
  headerBack: {
    padding: 4,
    marginRight: 6,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.1,
  },
  headerAvatar: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginLeft: 9,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    marginHorizontal: 13,
    gap: 7,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#F4F8FE',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DBE7FF',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 7,
    height: 42,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2B38',
    fontWeight: '400',
    marginLeft: 7,
  },
  sortButton: {
    paddingHorizontal: 4,
  },
  dateFilterBtn: {
    flexDirection: 'row',
    backgroundColor: '#045DFF',
    borderRadius: 5,
    paddingHorizontal: 13,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dateFilterText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 5,
  },
  sortMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginHorizontal: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  sortOptionActive: {
    backgroundColor: '#E0E3EB',
    fontWeight: '600',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Helvetica Neue',
  },
  sortOptionTextActive: {
    color: '#407BFF',
  },
activeFiltersWrap: {
  flexDirection: 'row',
  alignItems: 'center',
  height:10,

},


filterChip: {
  backgroundColor: '#F4F8FE',
  borderRadius: 15,
  paddingHorizontal: 12,
  paddingVertical: 4, // Increase slightly for vertical spacing without making chip too tall
  marginHorizontal: 6,
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#DBE7FF',
  alignSelf: 'flex-start', // So multiple chips wrap nicely without stretching full width
  minHeight: 28,            // Explicit height to avoid large height
  height: 28,               // Fix height to 28 for uniformity
  flexDirection: 'row',     // To make text and possible icons align horizontally
  alignItems: 'center',     // Vertically center text
},
filterChipText: {
  color: '#374151',
  fontSize: 13,
  fontWeight: '600',
  lineHeight: 18,           // Control line height for text vertical size
},

  dateInput: {
    backgroundColor: '#F4F8FE',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DBE7FF',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
  },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F4F8FE',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 3,
    marginBottom: 6,
  },
  monthLabel: {
    color: '#284879',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reportsLabel: {
    color: '#6983A3',
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F8FE',
  },
  scrollContent: {
    paddingBottom: 18,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 5,
    marginBottom: 7,
    paddingHorizontal: 17,
    paddingVertical: 15,
    elevation: 1,
    shadowColor: '#89ABC6',
    shadowOpacity: 0.09,
  },
  reportSymbol: { color: '#284879', fontWeight: '600', fontSize: 15, marginBottom: 2 },
  reportNSE: { color: '#7BA2CB', fontSize: 11, fontWeight: '400' },
  reportLTP: {
    color: '#68859D',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  reportCenter: { minWidth: 62, alignItems: 'flex-end', marginRight: 6 },
  tradeChip: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  buyChip: { backgroundColor: '#DEF7EC' },
  sellChip: { backgroundColor: '#FAD3D5' },
  mixedChip: { backgroundColor: '#E5E7EB' },
  tradeChipText: { fontSize: 13, fontWeight: '700' },
  buyChipText: { color: '#21A862' },
  sellChipText: { color: '#E22525' },
  mixedChipText: { color: '#6B7280' },
  reportDate: {
    color: '#98A7BF',
    fontSize: 9,
    fontWeight: '500',
  },
  reportRight: { padding: 4, marginLeft: 2 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E3EB',
    backgroundColor: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  webView: {
    flex: 1,
  },
  pdfLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  pdfLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40,58,95,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },backButton: { padding: 4,borderRadius:5, backgroundColor: '#fff',marginRight:10 },
  dateFilterPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: 285,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 12,
    elevation: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    marginTop: 11,
  },
  dateInput: {
    backgroundColor: '#F4F8FE',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DBE7FF',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
  },
  dateFilterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    gap: 11,
  },
  clearButton: {
    backgroundColor: '#407BFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#E0E3EB',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ResearchReportScreen;
