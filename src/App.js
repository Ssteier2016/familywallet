import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, TrendingUp, TrendingDown, DollarSign, Calendar, Users, 
  BarChart3, Trash2, Settings, Upload, X, AlertTriangle, CheckCircle, 
  ArrowRight, List
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

// Definición de CATEGORIES actualizada con parentId y limit
// parentId: null para categorías principales.
// limit: null inicialmente, se puede establecer en Configuración.
const CATEGORIES = [
  { id: 'comida', name: 'Comida', icon: '🍔', color: '#FF6B6B', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'salud', name: 'Salud', icon: '🏥', color: '#4ECDC4', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'auto', name: 'Auto', icon: '🚗', color: '#45B7D1', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'impuestos', name: 'Impuestos', icon: '📋', color: '#96CEB4', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'luz', name: 'Luz', icon: '💡', color: '#FFEAA7', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'agua', name: 'Agua', icon: '💧', color: '#74B9FF', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'gas', name: 'Gas', icon: '🔥', color: '#FD79A8', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'mejoras', name: 'Mejoras del hogar', icon: '🏠', color: '#A29BFE', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'educacion', name: 'Educación', icon: '📚', color: '#6C5CE7', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: '🎮', color: '#FD79A8', type: 'expense', isDefault: true, parentId: null, limit: null },
  { id: 'salario', name: 'Salario', icon: '💼', color: '#00B894', type: 'income', isDefault: true, parentId: null, limit: null },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#00CEC9', type: 'income', isDefault: true, parentId: null, limit: null },
  { id: 'inversion', name: 'Inversión', icon: '📈', color: '#0984E3', type: 'income', isDefault: true, parentId: null, limit: null }
];

export default function FamilyBudgetApp() {
  const [transactions, setTransactions] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [view, setView] = useState('add');
  const [showSettings, setShowSettings] = useState(false);
  const [newCategory, setNewCategory] = useState({ 
    name: '',
    type: 'expense',
    icon: '📌',
    color: '#95A5A6',
    isImage: false,
    limit: null,
    parentId: null,
  });
  const [newSubCategoryForm, setNewSubCategoryForm] = useState({ 
    name: '',
    parentId: '', 
    type: 'expense', 
  });
  const [limitForm, setLimitForm] = useState({
    categoryId: '',
    limit: '',
  });

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    currency: 'ARS',
    mainCategory: '', // ID de la categoría principal seleccionada
    category: '', // ID de la categoría/subcategoría específica
    customCategory: '', // Nombre temporal para crear nueva categoría
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);

  // --- Helpers for Categories and Data ---

  // Obtiene todas las categorías (predeterminadas + personalizadas)
  const getAllCategories = useMemo(() => {
    // Asegura que las categorías predeterminadas tienen los campos nuevos
    const defaultCats = CATEGORIES.map(c => ({
      ...c,
      parentId: c.parentId || null,
      limit: c.limit || null
    }));
    // Asegura que las categorías personalizadas tienen los campos nuevos
    const customCats = customCategories.map(c => ({
      ...c,
      parentId: c.parentId || null,
      limit: c.limit || null
    }));
    return [...defaultCats, ...customCats];
  }, [customCategories]);

  // Convierte el array de categorías a un mapa para búsquedas O(1)
  const categoryMap = useMemo(() => {
    return new Map(getAllCategories.map(c => [c.id, c]));
  }, [getAllCategories]);

  const getCategoryInfo = (catId) => {
    return categoryMap.get(catId) || { name: 'Sin categoría', icon: '❓', color: '#95A5A6', isImage: false, parentId: null, limit: null };
  };

  const getMainCategoriesByType = (type) => {
    return getAllCategories.filter(c => c.type === type && c.parentId === null);
  };

  const getSubcategories = (parentId) => {
    return getAllCategories.filter(c => c.parentId === parentId);
  };
  
  // Función para obtener el límite actual de una categoría (maneja defaults y customizados)
  const getCategoryLimit = (catId) => {
    const custom = customCategories.find(c => c.id === catId && c.parentId === null);
    if (custom && custom.limit !== null) {
      return custom.limit;
    }
    const defaultCat = CATEGORIES.find(c => c.id === catId);
    return defaultCat?.limit || null;
  }

  // --- Storage Logic ---

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transResult, catResult] = await Promise.all([
        window.storage.get('transactions', true).catch(() => null),
        window.storage.get('custom-categories', true).catch(() => null)
      ]);

      if (transResult?.value) {
        setTransactions(JSON.parse(transResult.value));
      }
      if (catResult?.value) {
        const loadedCats = JSON.parse(catResult.value).map(c => ({
          ...c,
          parentId: c.parentId || null, 
          limit: c.limit || null, 
        }));
        setCustomCategories(loadedCats);
      }
    } catch (error) {
      console.log('Iniciando con datos vacíos');
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newTransactions, newCustomCats = customCategories) => {
    try {
      await Promise.all([
        window.storage.set('transactions', JSON.stringify(newTransactions), true),
        window.storage.set('custom-categories', JSON.stringify(newCustomCats), true)
      ]);
      if (newCustomCats !== customCategories) {
        setCustomCategories(newCustomCats);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  // --- Transaction Logic ---

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let finalCategory = formData.category;
    let updatedCustomCats = customCategories;

    // 1. Lógica para crear una nueva categoría personalizada *principal*
    if (formData.mainCategory === 'custom' && formData.customCategory) {
      const newCat = {
        id: `custom-${Date.now()}`,
        name: formData.customCategory,
        icon: newCategory.icon,
        color: newCategory.color, 
        type: formData.type,
        isDefault: false,
        isImage: false,
        parentId: null,
        limit: null,
      };
      updatedCustomCats = [...customCategories, newCat];
      finalCategory = newCat.id;
    } else if (!formData.category) {
        // En caso de que no haya subcategorías, category debería ser igual a mainCategory.
        // Esto previene errores si la lógica de onChange falla.
        finalCategory = formData.mainCategory;
    }
    
    // 2. Determinar la categoría principal final (útil para el análisis, sea subcategoría o principal)
    const catInfo = getCategoryInfo(finalCategory);
    const finalMainCategory = catInfo.parentId || finalCategory; 

    const newTransaction = {
      id: Date.now(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: finalCategory, // ID de la subcat o cat principal
      mainCategory: finalMainCategory, // ID de la categoría principal (para análisis/límites)
      note: formData.note,
      date: formData.date,
      timestamp: new Date().toISOString()
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveData(updatedTransactions, updatedCustomCats);

    setFormData({
      type: 'expense',
      amount: '',
      currency: 'ARS',
      mainCategory: '',
      category: '',
      customCategory: '',
      note: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    saveData(updatedTransactions);
  };

  // --- Settings Logic ---

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCategory({
          ...newCategory,
          icon: reader.result,
          isImage: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Agrega una nueva categoría principal
  const addCustomCategory = () => {
    if (!newCategory.name.trim()) return;

    const categoryToAdd = {
      id: `custom-${Date.now()}`,
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color,
      type: newCategory.type,
      isDefault: false,
      isImage: newCategory.isImage,
      parentId: null, // Es principal
      limit: null,
    };

    const updatedCustomCats = [...customCategories, categoryToAdd];
    setCustomCategories(updatedCustomCats);
    saveData(transactions, updatedCustomCats);

    setNewCategory({
      name: '',
      type: 'expense',
      icon: '📌',
      color: '#95A5A6',
      isImage: false,
      limit: null,
      parentId: null,
    });
  };

  // Agrega una nueva subcategoría
  const addCustomSubCategory = () => {
    if (!newSubCategoryForm.name.trim() || !newSubCategoryForm.parentId) return;

    const parentCat = getCategoryInfo(newSubCategoryForm.parentId);

    const subCategoryToAdd = {
      id: `sub-${Date.now()}`,
      name: newSubCategoryForm.name,
      icon: parentCat.icon, 
      color: parentCat.color, 
      type: parentCat.type,
      isDefault: false,
      isImage: parentCat.isImage,
      parentId: newSubCategoryForm.parentId, 
      limit: null, 
    };

    const updatedCustomCats = [...customCategories, subCategoryToAdd];
    setCustomCategories(updatedCustomCats);
    saveData(transactions, updatedCustomCats);

    setNewSubCategoryForm({ name: '', parentId: '', type: 'expense' });
  };

  const deleteCustomCategory = (catId) => {
    const hasTransactions = transactions.some(t => t.category === catId || t.mainCategory === catId);
    const hasSubcategories = getSubcategories(catId).length > 0;
    
    if (hasTransactions || hasSubcategories) {
        console.error("No se puede eliminar: tiene transacciones o subcategorías asociadas.");
        // En una app real, mostrarías un modal de error aquí.
        return;
    }

    const updatedCustomCats = customCategories.filter(c => c.id !== catId);
    setCustomCategories(updatedCustomCats);
    saveData(transactions, updatedCustomCats);
  };

  // Establece el límite de presupuesto
  const handleSetLimit = (e) => {
    e.preventDefault();
    const { categoryId, limit } = limitForm;
    if (!categoryId || !limit) return;

    const limitValue = parseFloat(limit);
    if (isNaN(limitValue) || limitValue < 0) return;

    const targetCat = getAllCategories.find(c => c.id === categoryId);
    if (!targetCat) return;

    let updatedCustomCats = [...customCategories];

    // Lógica para manejar categorías predeterminadas y personalizadas
    const existingCustomIndex = updatedCustomCats.findIndex(c => c.id === categoryId && c.parentId === null);
    
    if (existingCustomIndex !== -1) {
      // Si ya existe en custom (es un default con límite o una custom sin límite)
      updatedCustomCats[existingCustomIndex].limit = limitValue;
    } else if (targetCat.isDefault) {
      // Si es predeterminada y no tiene registro de límite, creamos uno
      updatedCustomCats.push({ ...targetCat, limit: limitValue, isDefault: false });
    }

    setCustomCategories(updatedCustomCats);
    saveData(transactions, updatedCustomCats);
    setLimitForm({ categoryId: '', limit: '' });
  };
  
  // --- Analytics Logic ---

  const getCategorySpendingThisMonth = (mainCatId) => {
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    let totalSpent = 0;
    
    transactions.forEach(t => {
      const transactionMonth = new Date(t.date).getFullYear() + '-' + String(new Date(t.date).getMonth() + 1).padStart(2, '0');
      
      if (transactionMonth === currentMonth && t.type === 'expense' && t.mainCategory === mainCatId) {
        const amountInARS = t.currency === 'USD' ? t.amount * 1000 : t.amount;
        totalSpent += amountInARS;
      }
    });

    return totalSpent;
  };
  
  const getBudgetControlData = () => {
    const mainExpenseCategories = getMainCategoriesByType('expense');
    
    return mainExpenseCategories
      .map(cat => {
        const limit = getCategoryLimit(cat.id);
        if (limit === null || limit <= 0) return null;

        const spent = getCategorySpendingThisMonth(cat.id);
        const remaining = limit - spent;
        const percentage = (spent / limit) * 100;
        
        return {
          ...cat,
          limit,
          spent,
          remaining,
          percentage: Math.min(percentage, 100) 
        };
      })
      .filter(data => data !== null)
      .sort((a, b) => a.percentage - b.percentage); 
  };

  const getMonthlyData = () => {
    const monthlyMap = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, ingresos: 0, gastos: 0 };
      }

      const amountInARS = t.currency === 'USD' ? t.amount * 1000 : t.amount;
      
      if (t.type === 'income') {
        monthlyMap[monthKey].ingresos += amountInARS;
      } else {
        monthlyMap[monthKey].gastos += amountInARS;
      }
    });

    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  };

  const getCategoryBreakdown = () => {
    const categoryMap = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      // Usamos t.mainCategory para la agrupación del gráfico de pastel
      const displayId = t.mainCategory; 
      const displayCat = getCategoryInfo(displayId); 

      const amountInARS = t.currency === 'USD' ? t.amount * 1000 : t.amount;
      
      if (!categoryMap[displayId]) {
        categoryMap[displayId] = { 
          name: displayCat.name, 
          value: 0, 
          color: displayCat.color,
          icon: displayCat.icon,
          isImage: displayCat.isImage || false
        };
      }
      categoryMap[displayId].value += amountInARS;
    });

    return Object.values(categoryMap).sort((a, b) => b.value - a.value);
  };

  const getTotals = () => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const amountInARS = t.currency === 'USD' ? t.amount * 1000 : t.amount;
      if (t.type === 'income') {
        totalIncome += amountInARS;
      } else {
        totalExpense += amountInARS;
      }
    });

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  };

  const formatCurrency = (amount, currency = 'ARS') => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const totals = getTotals();
  const subcategoriesForMain = getSubcategories(formData.mainCategory);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Componente de barra de presupuesto
  const BudgetBar = ({ data }) => {
    const color = data.percentage >= 90 ? 'bg-red-500' : data.percentage >= 70 ? 'bg-orange-500' : 'bg-green-500';
    const indicator = data.percentage >= 90 ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />;

    return (
      <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{data.icon}</span>
            <h4 className="font-semibold text-gray-800">{data.name}</h4>
          </div>
          {indicator}
        </div>
        <div className="mt-2 text-sm text-gray-600 flex justify-between">
          <span>Gastado: <span className="font-bold text-gray-900">{formatCurrency(data.spent)}</span></span>
          <span>Límite: <span className="font-bold text-gray-900">{formatCurrency(data.limit)}</span></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className={`${color} h-2.5 rounded-full transition-all duration-500`} 
            style={{ width: `${data.percentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {data.remaining >= 0 
            ? `Quedan ${formatCurrency(data.remaining)}` 
            : `¡Exceso de ${formatCurrency(Math.abs(data.remaining))}!`
          }
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-inter">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                💰 Presupuesto Familiar
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Datos compartidos con la familia
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-gray-100 hover:bg-gray-200 p-3 rounded-xl transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Ingresos</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalIncome)}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Gastos</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.totalExpense)}</p>
                </div>
                <TrendingDown className="w-10 h-10 opacity-50" />
              </div>
            </div>

            <div className={`bg-gradient-to-br ${totals.balance >= 0 ? 'from-blue-400 to-blue-600' : 'from-orange-400 to-orange-600'} rounded-xl p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.balance)}</p>
                </div>
                <DollarSign className="w-10 h-10 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setView('add')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                view === 'add' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <PlusCircle className="w-5 h-5 inline mr-2" />
              Agregar
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                view === 'list' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Historial
            </button>
            <button
              onClick={() => setView('stats')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                view === 'stats' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-5 h-5 inline mr-2" />
              Estadísticas
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'add' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Agregar Transacción</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                        setFormData({...formData, type: 'expense', mainCategory: '', category: '', customCategory: ''});
                        setNewCategory({...newCategory, type: 'expense'});
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                      formData.type === 'expense'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingDown className="w-5 h-5 inline mr-2" />
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        setFormData({...formData, type: 'income', mainCategory: '', category: '', customCategory: ''});
                        setNewCategory({...newCategory, type: 'income'});
                    }}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                      formData.type === 'income'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="w-5 h-5 inline mr-2" />
                    Ingreso
                  </button>
                </div>
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="ARS">$ Pesos (ARS)</option>
                    <option value="USD">US$ Dólares (USD)</option>
                  </select>
                </div>
              </div>

              {/* Main Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría Principal</label>
                <select
                  value={formData.mainCategory}
                  onChange={(e) => {
                    const newMainId = e.target.value;
                    
                    // Si se selecciona una categoría existente, 'category' debe ser la ID principal por defecto.
                    const newCategoryValue = (newMainId && newMainId !== 'custom') ? newMainId : ''; 
                        
                    setFormData({
                        ...formData, 
                        mainCategory: newMainId, 
                        category: newCategoryValue,
                        customCategory: ''
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar principal...</option>
                  {getMainCategoriesByType(formData.type).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {!cat.isImage && cat.icon} {cat.name}
                    </option>
                  ))}
                  <option value="custom">➕ Crear nueva categoría...</option>
                </select>
              </div>
              
              {/* Subcategory (Only visible if main category is selected and has subcategories) */}
              {formData.mainCategory && formData.mainCategory !== 'custom' && subcategoriesForMain.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subcategoría (Opcional)</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {/* Por defecto, si no se selecciona subcategoría, se usa la categoría principal */}
                      <option value={formData.mainCategory}>[Usar {getCategoryInfo(formData.mainCategory).name} (Principal)]</option>
                      {subcategoriesForMain.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
              )}

              {/* Custom Category Input (If mainCategory is 'custom') */}
              {formData.mainCategory === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Nueva Categoría Principal</label>
                  <input
                    type="text"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({...formData, customCategory: e.target.value, category: 'custom'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Nombre de la categoría principal"
                    required
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nota (opcional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                  placeholder="Agregar una nota..."
                />
              </div>

              <button
                type="submit"
                // Validación: Se requiere monto, categoría principal. Si es 'custom', se requiere el nombre, sino, se requiere 'category' (que debe ser un ID válido).
                disabled={
                  !formData.amount || 
                  !formData.mainCategory || 
                  (formData.mainCategory === 'custom' && !formData.customCategory) ||
                  (formData.mainCategory !== 'custom' && !formData.category)
                }
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <PlusCircle className="w-5 h-5 inline mr-2" />
                Agregar {formData.type === 'expense' ? 'Gasto' : 'Ingreso'}
              </button>
            </form>
          </div>
        )}

        {view === 'list' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Transacciones</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay transacciones registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...transactions].reverse().map(transaction => {
                  const cat = getCategoryInfo(transaction.category);
                  const mainCat = getCategoryInfo(transaction.mainCategory); 
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-3xl">
                        {mainCat.isImage ? (
                          <img src={mainCat.icon} alt={mainCat.name} className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                          mainCat.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {cat.parentId ? (
                                <>
                                  {mainCat.name} <ArrowRight className="w-3 h-3 inline mx-1 text-gray-400" /> <span className="text-sm font-normal text-gray-600">{cat.name}</span>
                                </>
                            ) : (
                                cat.name
                            )}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString('es-AR')}</p>
                        {transaction.note && (
                          <p className="text-sm text-gray-600 mt-1">{transaction.note}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'stats' && (
          <div className="space-y-6">
            
            {/* Control de Presupuesto */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <List className="w-6 h-6 text-indigo-600" />
                Control de Presupuesto Mensual
              </h2>
              {getBudgetControlData().length > 0 ? (
                <div className="space-y-4">
                  {getBudgetControlData().map(data => (
                    <BudgetBar key={data.id} data={data} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded-xl">
                    <p className="text-gray-500">No hay límites de presupuesto configurados.</p>
                    <p className="text-sm text-indigo-500 mt-2 cursor-pointer" onClick={() => setShowSettings(true)}>
                      Configura un límite en Ajustes.
                    </p>
                </div>
              )}
            </div>
            
            {/* Monthly Chart */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Evolución Mensual</h2>
              {getMonthlyData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getMonthlyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value, '')} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} name="Ingresos" />
                    <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} name="Gastos" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">No hay datos suficientes</p>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Gastos por Categoría Principal</h2>
              {getCategoryBreakdown().length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getCategoryBreakdown()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getCategoryBreakdown().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-3">
                    {getCategoryBreakdown().map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          {cat.isImage ? (
                            <img src={cat.icon} alt={cat.name} className="w-8 h-8 object-cover rounded-lg" />
                          ) : (
                            <span className="text-2xl">{cat.icon}</span>
                          )}
                          <span className="font-medium text-gray-800">{cat.name}</span>
                        </div>
                        <span className="font-bold text-gray-700">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-12">No hay gastos registrados</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Configuración Avanzada</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              
              {/* --- 1. Establecer Límite de Presupuesto --- */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-indigo-600" /> 
                    Establecer Límite Mensual
                </h3>
                <form onSubmit={handleSetLimit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría Principal de Gasto</label>
                    <select
                      value={limitForm.categoryId}
                      onChange={(e) => setLimitForm({...limitForm, categoryId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar categoría...</option>
                      {getMainCategoriesByType('expense').map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({formatCurrency(getCategoryLimit(cat.id), 'ARS') || 'Sin límite'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Límite (en ARS)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={limitForm.limit}
                      onChange={(e) => setLimitForm({...limitForm, limit: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: 50000"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!limitForm.categoryId || !limitForm.limit}
                  >
                    Guardar Límite
                  </button>
                </form>
              </div>

              {/* --- 2. Crear Subcategoría --- */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <List className="w-5 h-5 text-purple-600" />
                    Crear Subcategoría
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría Principal</label>
                    <select
                      value={newSubCategoryForm.parentId}
                      onChange={(e) => {
                          const parentCat = getCategoryInfo(e.target.value);
                          setNewSubCategoryForm({
                              ...newSubCategoryForm, 
                              parentId: e.target.value, 
                              type: parentCat.type
                          });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar principal...</option>
                      {getMainCategoriesByType('expense').map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name} (Gasto)
                        </option>
                      ))}
                       {getMainCategoriesByType('income').map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name} (Ingreso)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Subcategoría</label>
                    <input
                      type="text"
                      value={newSubCategoryForm.name}
                      onChange={(e) => setNewSubCategoryForm({...newSubCategoryForm, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Cervezas, Nafta, Tutorías"
                      disabled={!newSubCategoryForm.parentId}
                    />
                  </div>
                  
                  <button
                    onClick={addCustomSubCategory}
                    disabled={!newSubCategoryForm.name.trim() || !newSubCategoryForm.parentId}
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-5 h-5 inline mr-2" />
                    Crear Subcategoría
                  </button>
                </div>
              </div>


              {/* --- 3. Crear Categoría Principal Nueva (Formulario Original) --- */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Agregar Nueva Categoría Principal</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Transporte, Regalos, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Categoría</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewCategory({...newCategory, type: 'expense'})}
                        className={`py-3 px-4 rounded-xl font-medium transition-all ${
                          newCategory.type === 'expense'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        <TrendingDown className="w-5 h-5 inline mr-2" />
                        Gasto
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCategory({...newCategory, type: 'income'})}
                        className={`py-3 px-4 rounded-xl font-medium transition-all ${
                          newCategory.type === 'income'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        <TrendingUp className="w-5 h-5 inline mr-2" />
                        Ingreso
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ícono / Color</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                            className="w-full h-12 rounded-xl cursor-pointer"
                        />
                        <p className="text-xs text-center text-gray-500 mt-1">Color</p>
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="category-image"
                        />
                        <label
                          htmlFor="category-image"
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 cursor-pointer transition-colors"
                        >
                          <Upload className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-600">Subir imagen</span>
                        </label>
                      </div>
                      <div className="w-20 h-20 border-2 border-gray-300 rounded-xl flex items-center justify-center bg-gray-50" style={{backgroundColor: newCategory.color + '30'}}>
                        {newCategory.isImage ? (
                          <img src={newCategory.icon} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-4xl">{newCategory.icon}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={addCustomCategory}
                    disabled={!newCategory.name.trim()}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-5 h-5 inline mr-2" />
                    Agregar Categoría Principal
                  </button>
                </div>
              </div>

              {/* --- 4. Categories List (Actualizado para mostrar jerarquía) --- */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Todas las Categorías</h3>
                <div className="space-y-2">
                  {getMainCategoriesByType('expense').map(mainCat => (
                    <React.Fragment key={mainCat.id}>
                      {/* Categoría Principal */}
                      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-xl border border-gray-200">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                {mainCat.isImage ? (
                                    <img src={mainCat.icon} alt={mainCat.name} className="w-8 h-8 object-cover rounded-lg" />
                                ) : (
                                    <span className="text-xl">{mainCat.icon}</span>
                                )}
                                <span className="font-bold text-gray-800">{mainCat.name}</span>
                                {mainCat.isDefault && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Predeterminada</span>
                                )}
                            </div>
                            {getCategoryLimit(mainCat.id) && (
                                <span className="text-xs text-indigo-600 font-medium">Límite: {formatCurrency(getCategoryLimit(mainCat.id), 'ARS')}</span>
                            )}
                        </div>
                        {/* Solo permitir eliminar si no tiene subcategorías ni transacciones */}
                        {!mainCat.isDefault && getSubcategories(mainCat.id).length === 0 && !transactions.some(t => t.mainCategory === mainCat.id) && (
                          <button
                            onClick={() => deleteCustomCategory(mainCat.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      {/* Subcategorías */}
                      {getSubcategories(mainCat.id).map(subCat => (
                        <div key={subCat.id} className="flex items-center justify-between p-3 ml-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-700">{subCat.name}</span>
                            </div>
                            {/* Solo permitir eliminar si no tiene transacciones */}
                            {!transactions.some(t => t.category === subCat.id) && (
                              <button
                                  onClick={() => deleteCustomCategory(subCat.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors p-2"
                              >
                                  <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  {/* Categorías de Ingresos Principales (sin subcategorías por simplicidad) */}
                   {getMainCategoriesByType('income').map(mainCat => (
                    <div key={mainCat.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{mainCat.icon}</span>
                            <span className="font-bold text-gray-800">{mainCat.name} (Ingreso)</span>
                        </div>
                        {!mainCat.isDefault && !transactions.some(t => t.mainCategory === mainCat.id) && (
                          <button
                            onClick={() => deleteCustomCategory(mainCat.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                    </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

