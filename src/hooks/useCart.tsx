import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';
import axios from "axios";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart]
      const productExists = updateCart.find(product => product.id === productId)

      const stock = await api.get(`http://localhost:3333/stock/${productId}`)

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0
      const amount = currentAmount + 1

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      if(productExists) {
        productExists.amount = amount
      }else {

        const {data} = await axios.get(`http://localhost:3333/products/${productId}`)
        const newProduct = {
          ...data,
          amount: 1
        }
        updateCart.push(newProduct)

      }
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedProducts = [...cart]
      const productIndex = updatedProducts.findIndex(product => product.id === productId)

      if(productIndex >= 0) {
        updatedProducts.splice(productIndex, 1)
        setCart(updatedProducts)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProducts))
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
  }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return
      }
      const stock = await api.get(`http://localhost:3333/stock/${productId}`)

      const stockAmount = stock.data.amount;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      const updatedItens = cart.map(item => {
        if(item.id === productId) {
          return {
            ...item,
            amount
          }
        }
        return item

      })
      setCart([...updatedItens])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedItens))


    } catch {
        toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  return  useContext(CartContext);
}
