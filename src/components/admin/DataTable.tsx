'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  actions?: Array<{
    label: string;
    onClick: (row: T) => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
  searchKeys?: (keyof T)[];
  filterOptions?: Array<{
    key: string;
    label: string;
    values: Array<{ label: string; value: any }>;
  }>;
  pageSize?: number;
}

/**
 * DataTable
 * Reusable data table component with sorting, pagination, search, and filters
 */
export default function DataTable<T extends { id?: string }>({
  data,
  columns,
  onRowClick,
  actions,
  searchKeys = [],
  filterOptions = [],
  pageSize = 10,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);

  // Filter data
  let filteredData = data.filter((row) => {
    // Apply search
    if (searchQuery && searchKeys.length > 0) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchKeys.some((key) => {
        const value = row[key];
        return String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // Apply filters
    for (const [filterKey, filterValue] of Object.entries(activeFilters)) {
      if (filterValue && (row as any)[filterKey] !== filterValue) {
        return false;
      }
    }

    return true;
  });

  // Sort data
  if (sortKey) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Paginate
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleFilter = (filterKey: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? undefined : value,
    }));
    setCurrentPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      {(searchKeys.length > 0 || filterOptions.length > 0) && (
        <div className="space-y-3 rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
          {/* Search */}
          {searchKeys.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full rounded-lg border border-gray-700/50 bg-gray-900/50 py-2 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          )}

          {/* Filters */}
          {filterOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((filter) => (
                <div key={filter.key} className="flex gap-2">
                  {filter.values.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleFilter(filter.key, option.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeFilters[filter.key] === option.value
                          ? 'bg-amber-500 text-gray-900'
                          : 'border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/30 bg-gray-800/50">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left font-semibold text-gray-400"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                    >
                      {column.label}
                      {sortKey === column.key &&
                        (sortOrder === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        ))}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right font-semibold text-gray-400">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-700/30 ${
                  onRowClick ? 'hover:bg-gray-800/50 cursor-pointer' : ''
                } transition-colors`}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 text-gray-300">
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key])}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            action.variant === 'danger'
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              : action.variant === 'secondary'
                              ? 'bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, filteredData.length)} of{' '}
            {filteredData.length}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentPage === i
                    ? 'bg-amber-500 text-gray-900'
                    : 'border border-gray-700/50 bg-gray-800/30 text-gray-400 hover:text-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-200 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paginatedData.length === 0 && (
        <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-8 text-center">
          <p className="text-sm text-gray-400">No results found</p>
        </div>
      )}
    </div>
  );
}
