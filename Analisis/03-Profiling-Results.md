# X8 Profiling Results — Where Time Actually Goes

**Date:** 2026-09-09 | **Method:** cProfile in Docker (Freqtrade 2026.8)
**Scope:** 5 active pairs (RENDER/SUI/CATI/XRP/WLD) × 3 months (2026-03→06), 5 trades

## Summary

| Component | Time | % |
|---|---:|---:|
| pandas/copy internals (deepcopy + row access) | 85.5s | 87% |
| Freqtrade framework | 8.0s | 8% |
| X8 own code (tottime) | 4.2s | 4% |
| Rich/progress UI noise | 1.1s | 1% |

## Key Findings

1. **Indicators are NOT the bottleneck.** `populate_indicators` = 0.11s/pair, `populate_entry_trend` = 0.06s/pair (5 pairs total: 0.55s + 0.30s). X8's numpy vectorization (np_view, np_shift, concat blocks) already paid off.

2. **Runtime exit/DCA methods dominate.** `custom_exit` + `adjust_trade_position` called **7,202 times each** (once per 5m candle × open trade):
   - `adjust_trade_position` → 26.2s cumtime (dispatches to grind logic)
   - `long_grind_adjust_trade_position` (v4, 2,100 lines) → 24.8s cumtime, 6,993 calls
   - `custom_exit` (560 lines) → 22.5s cumtime
   - Most calls evaluate when NO DCA/exit applies

3. **deepcopy storm: 10.6M calls / 22.5s.** Freqtrade's strategy_wrapper deep-copies args on every custom_exit/adjust_trade_position invocation (7,202 × trade object graph). Framework-level cost, not X8 code, but amplified by method complexity.

4. **pandas row access (~25s fast_xs).** `last_candle["col"]` scalar access through pandas indexing (`_ixs` → `fast_xs`, 28,648 calls) inside exit/grind methods. Each is a pandas internals lookup rather than numpy scalar.

## Optimization Targets (same signals, faster execution)

| # | Target | Est. saving | Risk |
|---|---|---|---|
| 1 | Reduce deepcopy amplification (framework wrapper) — fewer/cheaper calls via early dispatch | High (~20s) | Low |
| 2 | Cache `last_candle` row to numpy scalars once per call instead of repeated `["col"]` pandas lookups | Medium | Low |
| 3 | Early-exit guards in custom_exit/adjust (skip grind eval when profit above/below bands) | Medium | Medium — must A/B |
| 4 | Mode dispatch: skip v3/v4 grind engines when trade system_version is v2 (and vice versa) | Medium | Low |

## Files
- Profile: `user_data/logs/x8-profile-5pair.prof`
- Log: `user_data/logs/x8-profile-5pair.log`
- Profiling script: `tools_local/profile_run.py`
- Debug-instrumented strategy: `NostalgiaForInfinityX8-debug.py` (debug_time=True in all indicator fns)
