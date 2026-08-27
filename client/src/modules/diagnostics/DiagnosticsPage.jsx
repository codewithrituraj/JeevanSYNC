import React, { useState, useEffect } from 'react';
import { HeartPulse, Search, Filter, Clock, Building, ArrowUpDown, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const DiagnosticsPage = () => {
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('price_asc');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTests();
  }, [selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/diagnostics/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const params = { sortBy };
      if (searchQuery) params.query = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      const res = await api.get('/diagnostics/search', { params });
      if (res.success) setTests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Diagnostic Tests & Lab Price Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Compare pathology, biochemistry, and imaging prices across certified hospital labs
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search test (e.g. CBC, Lipid, MRI)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTests()}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="turnaround_asc">Fastest Turnaround</option>
            <option value="name_asc">Test Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Test List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-700">No diagnostic tests found matching filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      {test.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1 leading-tight">
                      {test.testName}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 block">
                      ₹{test.price}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      Best Price Guaranteed
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Turnaround Time: <strong>~{test.turnaroundHours} hours</strong></span>
                  </p>
                  {test.sampleType && (
                    <p>🧪 Sample Required: <strong>{test.sampleType}</strong></p>
                  )}
                  {test.prerequisites && (
                    <p className="text-amber-800">⚠️ Instructions: {test.prerequisites}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{test.hospital?.name} ({test.hospital?.city})</span>
                </p>
                <a
                  href={`tel:${test.hospital?.contactPhone}`}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  Book Test
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
