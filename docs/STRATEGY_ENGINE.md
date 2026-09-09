# Strategy configuration engine

A StrategyTemplate contains identity, type, risk, description, assets, supported networks/protocols, field definitions, and defaults. All three strategy families use the same renderer; template selection prepopulates values. Registry metadata defines field ranges, options, grouping and validation. Derived values are computed from current form state.

Index allocation validation enforces nonnegative weights totaling 100. Perpetual controls include bounded leverage, margin, stop loss, take profit and maximum drawdown. Network/protocol compatibility is checked before review.

Simulation is deterministic and synthetic, not a historical backtest. Scenario, time horizon, assumed annual gross return, fees, and leverage affect the curve. Metrics are derived from that curve; assumptions are visible. There is no claim that simplified risk bands are a protocol assessment.
