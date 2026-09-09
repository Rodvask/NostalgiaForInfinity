# X8 Baseline Results — Binance Futures

**Date:** 2026-09-09 | **Strategy:** NostalgiaForInfinityX8 (v18.0.18) | **Env:** Freqtrade 2026.8 (Docker stable)

## Setup
- **Pairs:** 75 (top volume del pairlist oficial NFI, Binance USDT-M futures)
- **Timerange:** 2026-03-01 → 2026-09-09 (192 days)
- **Data:** 5m/15m/1h/4h/1d feather, descargado desde 2025-06-01 (warmup)
- **Wallet:** 10,000 USDT dry-run | max_open_trades: 6 | stake unlimited
- **Config:** trading_mode-futures + exampleconfig + pairlist custom (use_order_book: true)

## Results (baseline sin cambios)

| Metric | Value |
|---|---|
| Trades | 125 |
| Profit | **+13,311 USDT (+133.11%)** |
| Win rate | 97.6% (122W / 0D / 3L) |
| Avg profit/trade | +7.17% |
| Max Drawdown | 246 USDT (2.39% CLI) |
| Sharpe | 7.82 |
| Sortino | 19.96 |
| Calmar | 554.67 |
| Avg duration | ~1d 21h |
| Wall time | ~6m13s (75 pairs × 192d) |

## Log Health
- **0 errores / 0 tracebacks** en ejecución final
- Warnings benignos: data starts (pares listados post-2025-06), deprecation --export-filename

## Caveats
- Resultado pre-optimización, config por defecto del repo.
- +133% / 97.6% WR con 3 pérdidas — verificar realismo (fees/slippage/funding) antes de conclusiones de rentabilidad.
- OOM con 75 pares si `--export signals` activo o sin `reduce_df_footprint: true`.
