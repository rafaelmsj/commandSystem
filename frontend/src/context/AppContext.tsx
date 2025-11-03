import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Cliente, Produto, Comanda, LancamentoProduto, Pagamento } from '../types';

interface AppState {
  clientes: Cliente[];
  produtos: Produto[];
  comandas: Comanda[];
  lancamentos: LancamentoProduto[];
  pagamentos: Pagamento[];
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CLIENTES'; payload: Cliente[] }
  | { type: 'ADD_CLIENTE'; payload: Cliente }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'REMOVE_CLIENTE'; payload: number }
  | { type: 'SET_PRODUTOS'; payload: Produto[] }
  | { type: 'ADD_PRODUTO'; payload: Produto }
  | { type: 'UPDATE_PRODUTO'; payload: Produto }
  | { type: 'REMOVE_PRODUTO'; payload: number }
  | { type: 'SET_COMANDAS'; payload: Comanda[] }
  | { type: 'ADD_COMANDA'; payload: Comanda }
  | { type: 'UPDATE_COMANDA'; payload: Comanda }
  | { type: 'REMOVE_COMANDA'; payload: number }
  | { type: 'SET_LANCAMENTOS'; payload: LancamentoProduto[] }
  | { type: 'ADD_LANCAMENTO'; payload: LancamentoProduto }
  | { type: 'REMOVE_LANCAMENTO'; payload: number }
  | { type: 'SET_PAGAMENTOS'; payload: Pagamento[] }
  | { type: 'ADD_PAGAMENTO'; payload: Pagamento }
  | { type: 'REMOVE_PAGAMENTO'; payload: number };

const initialState: AppState = {
  clientes: [],
  produtos: [],
  comandas: [],
  lancamentos: [],
  pagamentos: [],
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CLIENTES':
      return { ...state, clientes: action.payload };
    case 'ADD_CLIENTE':
      return { ...state, clientes: [...state.clientes, action.payload] };
    case 'UPDATE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'REMOVE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.filter(c => c.id !== action.payload),
      };
    case 'SET_PRODUTOS':
      return { ...state, produtos: action.payload };
    case 'ADD_PRODUTO':
      return { ...state, produtos: [...state.produtos, action.payload] };
    case 'UPDATE_PRODUTO':
      return {
        ...state,
        produtos: state.produtos.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'REMOVE_PRODUTO':
      return {
        ...state,
        produtos: state.produtos.filter(p => p.id !== action.payload),
      };
    case 'SET_COMANDAS':
      return { ...state, comandas: action.payload };
    case 'ADD_COMANDA':
      return { ...state, comandas: [...state.comandas, action.payload] };
    case 'UPDATE_COMANDA':
      return {
        ...state,
        comandas: state.comandas.map(c => 
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'REMOVE_COMANDA':
      return {
        ...state,
        comandas: state.comandas.filter(c => c.id !== action.payload),
      };
    case 'SET_LANCAMENTOS':
      return { ...state, lancamentos: action.payload };
    case 'ADD_LANCAMENTO':
      return { ...state, lancamentos: [...state.lancamentos, action.payload] };
    case 'REMOVE_LANCAMENTO':
      return {
        ...state,
        lancamentos: state.lancamentos.filter(l => l.id !== action.payload),
      };
    case 'SET_PAGAMENTOS':
      return { ...state, pagamentos: action.payload };
    case 'ADD_PAGAMENTO':
      return { ...state, pagamentos: [...state.pagamentos, action.payload] };
    case 'REMOVE_PAGAMENTO':
      return {
        ...state,
        pagamentos: state.pagamentos.filter(p => p.id !== action.payload),
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}