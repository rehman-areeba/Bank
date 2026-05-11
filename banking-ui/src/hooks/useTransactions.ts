import { useInfiniteQuery } from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import type { TransactionsParams } from '../types';

export const useTransactions = (params: Omit<TransactionsParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: ['transactions', params],
    queryFn: ({ pageParam = 1 }) =>
      accountService.getTransactions({ ...params, page: pageParam, pageSize: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
  });
};
