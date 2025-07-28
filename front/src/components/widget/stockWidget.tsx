import React from 'react';

const stocks = [
  { symbol: 'AAPL', name: 'Apple', price: 192.32, change: +1.23 },
  { symbol: 'TSLA', name: 'Tesla', price: 254.12, change: -2.11 },
  { symbol: 'GOOGL', name: 'Google', price: 134.56, change: +0.87 },
  { symbol: 'NVDA', name: 'NVIDIA', price: 456.78, change: +3.45 },
];

export default function StockWidget() {
  return (
    <div className="bg-white rounded-lg p-4">
      <div className="font-bold text-gray-800 mb-2">오늘의 주식</div>
      <div className="space-y-2">
        {stocks.map(stock => (
          <div key={stock.symbol} className="flex items-center gap-2">
            <span className="font-mono text-blue-600 w-14">{stock.symbol}</span>
            <span className="flex-1 truncate">{stock.name}</span>
            <span className="font-semibold">${stock.price.toFixed(2)}</span>
            <span className={stock.change >= 0 ? 'text-green-600' : 'text-red-500'}>
              {stock.change >= 0 ? '+' : ''}{stock.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 