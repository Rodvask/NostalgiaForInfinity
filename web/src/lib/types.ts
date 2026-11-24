export type TradeSide = "long" | "short";

export interface OpenTrade {
  trade_id: number;
  pair: string;
  is_short: boolean;
  leverage: number;
  amount: number;
  stake_amount: number;
  open_rate: number;
  current_rate: number;
  profit_abs: number;
  profit_ratio: number;
  open_date: string;
  enter_tag: string;
}

export interface ClosedTrade {
  trade_id: number;
  pair: string;
  is_short: boolean;
  leverage: number;
  open_rate: number;
  close_rate: number;
  profit_abs: number;
  profit_ratio: number;
  open_date: string;
  close_date: string;
  exit_reason: string;
  enter_tag: string;
  trade_duration: number;
}

export interface PairPerformance {
  pair: string;
  profit_abs: number;
  profit_percent: number;
  count: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
}

export interface BotConfig {
  strategy: string;
  version: string;
  timeframe: string;
  maxOpenTrades: number;
  stakeAmount: number;
  dryRun: boolean;
  exchange: string;
  tradingMode: string;
}

export interface DashboardData {
  mode: "demo" | "live";
  generatedAt: string;
  config: BotConfig;
  summary: {
    equity: number;
    netPnl: number;
    netPnlPct: number;
    realizedPnl: number;
    unrealizedPnl: number;
    winRate: number;
    winners: number;
    losers: number;
    closedTrades: number;
    openTrades: number;
    maxDrawdown: number;
    profitFactor: number | null;
  };
  equity: EquityPoint[];
  openTrades: OpenTrade[];
  recentTrades: ClosedTrade[];
  pairPerformance: PairPerformance[];
  whitelist: string[];
  errors?: string[];
}
