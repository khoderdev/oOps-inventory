import { Activity, ArrowRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStockMovements } from '../../hooks/useStock';
import { MovementType, type SortConfig, type StockMovement } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table from '../ui/Table';

const StockMovementsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<MovementType | ''>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', order: 'desc' });

  const { data: stockMovements = [], isLoading } = useStockMovements();

  const typeOptions = Object.values(MovementType).map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));

  const filteredData = useMemo(() => {
    const filtered = stockMovements.filter(movement => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!movement.reason?.toLowerCase().includes(searchLower) &&
            !movement.performedBy?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (typeFilter && movement.type !== typeFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortConfig.field];
      const bValue = (b as Record<string, unknown>)[sortConfig.field];

      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockMovements, searchTerm, typeFilter, sortConfig]);

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getTypeColor = (type: MovementType) => {
    switch (type) {
      case MovementType.IN:
        return 'bg-green-100 text-green-800';
      case MovementType.OUT:
        return 'bg-red-100 text-red-800';
      case MovementType.TRANSFER:
        return 'bg-blue-100 text-blue-800';
      case MovementType.ADJUSTMENT:
        return 'bg-yellow-100 text-yellow-800';
      case MovementType.EXPIRED:
        return 'bg-gray-100 text-gray-800';
      case MovementType.DAMAGED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      key: 'type',
      title: 'Type',
      render: (item: StockMovement) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </span>
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity',
      sortable: true,
      render: (item: StockMovement) => `${item.quantity}`,
    },
    {
      key: 'direction',
      title: 'Direction',
      render: (item: StockMovement) => {
        if (item.type === MovementType.TRANSFER) {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{item.fromSectionId || 'Stock'}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{item.toSectionId || 'Stock'}</span>
            </div>
          );
        }
        return item.type === MovementType.IN ? 'Incoming' : 'Outgoing';
      },
    },
    {
      key: 'reason',
      title: 'Reason',
      render: (item: StockMovement) => item.reason,
    },
    {
      key: 'performedBy',
      title: 'Performed By',
      render: (item: StockMovement) => item.performedBy,
    },
    {
      key: 'createdAt',
      title: 'Date',
      sortable: true,
      render: (item: StockMovement) => new Date(item.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.values(MovementType).map(type => {
          const count = stockMovements.filter(m => m.type === type).length;
          const totalQuantity = stockMovements
            .filter(m => m.type === type)
            .reduce((sum, m) => sum + m.quantity, 0);
          
          return (
            <div key={type} className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-gray-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">Total: {totalQuantity}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search movements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
        
        <Select
          placeholder="Filter by type"
          options={[{ value: '', label: 'All Types' }, ...typeOptions]}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as MovementType | '')}
        />

        <div></div>
      </div>

      {/* Table */}
      <Table
        data={filteredData}
        columns={columns}
        loading={isLoading}
        emptyMessage="No stock movements found."
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  );
};

export default StockMovementsTab; 