import type {
  ClosedTrade,
  DashboardData,
  EquityPoint,
  OpenTrade,
  PairPerformance,
} from "./types";

const DAY = 86_400_000;

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return value / 4_294_967_296;
  };
}

function isoDaysAgo(days: number, minutes = 0): string {
  return new Date(Date.now() - days * DAY - minutes * 60_000).toISOString();
}

export function makeDemoData(): DashboardData {
  const random = seeded(91_009);
  const pairs = [
    "BTC/USDT:USDT",
    "ETH/USDT:USDT",
    "SOL/USDT:USDT",
    "SUI/USDT:USDT",
    "ARB/USDT:USDT",
    "INJ/USDT:USDT",
    "TIA/USDT:USDT",
    "LINK/USDT:USDT",
  ];

  const equity: EquityPoint[] = [];
  let value = 100_000;
  let peak = value;
  let maxDrawdown = 0;

  for (let day = 59; day >= 0; day -= 1) {
    const drift = 0.0014;
    const shock = (random() - 0.47) * 0.011;
    value = Math.max(94_000, value * (1 + drift + shock));
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak);
    equity.push({
      date: isoDaysAgo(day),
      equity: Number(value.toFixed(2)),
      pnl: Number((value - 100_000).toFixed(2)),
    });
  }

  const recentTrades: ClosedTrade[] = [
    ["SOL/USDT:USDT", false, 4_210, 2.84, "exit_signal", "rebuy_63", 184],
    ["ETH/USDT:USDT", true, 8_930, 1.42, "target", "trend_64", 342],
    ["ARB/USDT:USDT", false, -2_140, -0.91, "stop_loss", "rebuy_62", 96],
    ["SUI/USDT:USDT", false, 6_470, 3.18, "target", "rebuy_61", 512],
    ["INJ/USDT:USDT", true, 3_880, 1.76, "exit_signal", "trend_64", 228],
    ["TIA/USDT:USDT", false, 5_260, 2.06, "roi", "pullback_65", 1_104],
    ["LINK/USDT:USDT", false, -1_320, -0.63, "exit_bad_trade", "rebuy_63", 76],
    ["BTC/USDT:USDT", true, 2_460, 0.88, "exit_signal", "trend_64", 418],
  ].map((row, index) => {
    const [pair, isShort, profitAbs, profitPct, exitReason, enterTag, duration] =
      row as [string, boolean, number, number, string, string, number];
    const openRate = 20 + random() * 2_400;
    const closeRate = openRate * (1 + (isShort ? -1 : 1) * (profitPct / 100));
    return {
      trade_id: 10_824 - index,
      pair,
      is_short: isShort,
      leverage: isShort ? 2 : 3,
      open_rate: Number(openRate.toFixed(4)),
      close_rate: Number(closeRate.toFixed(4)),
      profit_abs: Number((profitAbs / 100).toFixed(2)),
      profit_ratio: profitPct / 100,
      open_date: isoDaysAgo(2 + index * 0.7, index * 37),
      close_date: isoDaysAgo(1.7 + index * 0.7, index * 37),
      exit_reason: exitReason,
      enter_tag: enterTag,
      trade_duration: duration,
    };
  });

  const openTrades: OpenTrade[] = [
    ["BTC/USDT:USDT", false, 67_420, 68_910, 6_240, 2.21, "rebuy_63"],
    ["ETH/USDT:USDT", true, 3_640, 3_598, 1_180, 1.15, "trend_64"],
    ["SOL/USDT:USDT", false, 148.2, 151.7, 2_890, 2.36, "rebuy_62"],
  ].map((row, index) => {
    const [pair, isShort, openRate, currentRate, profitAbs, profitPct, enterTag] =
      row as [string, boolean, number, number, number, number, string];
    return {
      trade_id: 10_841 + index,
      pair,
      is_short: isShort,
      leverage: 3,
      amount: 1,
      stake_amount: 100,
      open_rate: Number(openRate.toFixed(4)),
      current_rate: Number(currentRate.toFixed(4)),
      profit_abs: Number((profitAbs / 100).toFixed(2)),
      profit_ratio: profitPct / 100,
      open_date: isoDaysAgo(0.2 + index * 0.3, index * 41),
      enter_tag: enterTag,
    };
  });

  const pairPerformance: PairPerformance[] = pairs
    .map((pair, index) => ({
      pair,
      profit_abs: Number(
        (2_400 - index * 610 + random() * 1_800).toFixed(2),
      ),
      profit_percent: Number((4.4 - index * 0.7 + random()).toFixed(2)),
      count: 4 + ((index * 3) % 9),
    }))
    .sort((a, b) => b.profit_abs - a.profit_abs);

  const unrealized = openTrades.reduce((sum, trade) => sum + trade.profit_abs, 0);
  const equityNow = equity.at(-1)?.equity ?? 100_000;
  const netPnl = equityNow - 100_000;
  const realized = netPnl - unrealized;
  const closedTrades = 84;
  const winners = 63;
  const losers = 21;
  const grossProfit = recentTrades
    .filter((trade) => trade.profit_abs > 0)
    .reduce((sum, trade) => sum + trade.profit_abs, 0);
  const grossLoss = Math.abs(
    recentTrades
      .filter((trade) => trade.profit_abs < 0)
      .reduce((sum, trade) => sum + trade.profit_abs, 0),
  );

  return {
    mode: "demo",
    generatedAt: new Date().toISOString(),
    config: {
      strategy: "NostalgiaForInfinityX9",
      version: "v19.0.0",
      timeframe: "5m",
      maxOpenTrades: 12,
      stakeAmount: 100,
      dryRun: true,
      exchange: "Binance Futures",
      tradingMode: "futures",
    },
    summary: {
      equity: equityNow,
      netPnl,
      netPnlPct: (netPnl / 100_000) * 100,
      realizedPnl: realized,
      unrealizedPnl: unrealized,
      winRate: (winners / Math.max(1, winners + losers)) * 100,
      winners,
      losers,
      closedTrades,
      openTrades: openTrades.length,
      maxDrawdown: maxDrawdown * 100,
      profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    },
    equity,
    openTrades,
    recentTrades,
    pairPerformance,
    whitelist: pairs,
  };
}
