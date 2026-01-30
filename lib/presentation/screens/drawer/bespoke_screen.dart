import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../../core/utils/formatters.dart';

/// Bespoke Plans screen
class BespokeScreen extends ConsumerWidget {
  const BespokeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bespoke Plans'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Introduction card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        LucideIcons.target,
                        color: config.primaryColor,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Personalized Investment Plans',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Get customized stock recommendations tailored to your investment goals, risk appetite, and time horizon.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade700,
                        ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Plans
          Text(
            'Available Plans',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),

          _buildPlanCard(
            context,
            config,
            name: 'Starter',
            price: 4999,
            duration: 'Monthly',
            features: [
              '5 stock recommendations per month',
              'Entry, target & stop-loss levels',
              'WhatsApp alerts',
              'Email support',
            ],
          ),

          _buildPlanCard(
            context,
            config,
            name: 'Professional',
            price: 14999,
            duration: 'Quarterly',
            features: [
              '15 stock recommendations',
              'Priority execution alerts',
              'Portfolio review',
              'Phone support',
              'Rebalancing advice',
            ],
            isPopular: true,
          ),

          _buildPlanCard(
            context,
            config,
            name: 'Premium',
            price: 49999,
            duration: 'Yearly',
            features: [
              'Unlimited recommendations',
              'Real-time alerts',
              'Dedicated advisor',
              '1-on-1 consultations',
              'Tax planning advice',
              'Priority order execution',
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(
    BuildContext context,
    dynamic config, {
    required String name,
    required double price,
    required String duration,
    required List<String> features,
    bool isPopular = false,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (isPopular)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: config.primaryColor,
              child: const Text(
                'MOST POPULAR',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      Formatters.formatCurrency(price),
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: config.primaryColor,
                          ),
                    ),
                    const SizedBox(width: 4),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        '/ $duration',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey,
                            ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 16),
                ...features.map((feature) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.check,
                            size: 18,
                            color: Colors.green,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              feature,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                        ],
                      ),
                    )),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: isPopular
                      ? ElevatedButton(
                          onPressed: () {
                            // TODO: Handle subscription
                          },
                          child: const Text('Subscribe Now'),
                        )
                      : OutlinedButton(
                          onPressed: () {
                            // TODO: Handle subscription
                          },
                          child: const Text('Choose Plan'),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
