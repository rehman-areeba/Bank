// Monthly income vs expense - last 6 months
export const monthlyData = [
  { month: 'Aug', income: 85000, expense: 42000 },
  { month: 'Sep', income: 92000, expense: 55000 },
  { month: 'Oct', income: 78000, expense: 38000 },
  { month: 'Nov', income: 105000, expense: 61000 },
  { month: 'Dec', income: 98000, expense: 72000 },
  { month: 'Jan', income: 112000, expense: 48000 },
];

// Balance trend - last 30 days
const today = new Date();
const generateBalanceTrend = () => {
  const data = [];
  let balance = 45000;
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const label = date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    // Simulate realistic balance fluctuations
    const change = (Math.random() - 0.42) * 8000;
    balance = Math.max(10000, balance + change);
    data.push({ date: label, balance: Math.round(balance) });
  }
  return data;
};

export const balanceTrendData = generateBalanceTrend();
