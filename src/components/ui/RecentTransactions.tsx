import React from 'react';
import { Transaction } from '../../types';
import { 
  getCategoryName, 
  getAccountName, 
  formatCurrency, 
  formatDate
} from '../../utils/dummyData';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <div className="space-y-2 lg:space-y-3">
      {transactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className="flex items-center justify-between p-3 lg:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer active:scale-98"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              transaction.type === 'income' 
                ? 'bg-success-100 text-success-600' 
                : 'bg-danger-100 text-danger-600'
            }`}>
              <span className="text-xs lg:text-sm font-bold">
                {transaction.type === 'income' ? '+' : '-'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm lg:text-base font-medium text-gray-900 truncate">
                {transaction.description || getCategoryName(transaction.category_id || '')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getCategoryName(transaction.category_id || '')} • {getAccountName(transaction.account_id || '')}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <p className={`text-sm lg:text-base font-medium ${
              transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTransactions; 