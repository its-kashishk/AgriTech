import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
const KEY = 'agritech_cart';

// The cart only remembers product ids + quantities for display. Prices are re-read from the database by the server at checkout.
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    add: (p, qty = 1) => setItems((cur) => {
      const found = cur.find((i) => i._id === p._id);
      const quantity = Math.min((found ? found.quantity : 0) + qty, p.stock);
      const row = { _id: p._id, name: p.name, price: p.price, unit: p.unit, stock: p.stock, quantity };
      return found ? cur.map((i) => (i._id === p._id ? row : i)) : [...cur, row];
    }),
    setQty: (id, quantity) => setItems((cur) => cur.map((i) => (i._id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i))),
    remove: (id) => setItems((cur) => cur.filter((i) => i._id !== id)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
