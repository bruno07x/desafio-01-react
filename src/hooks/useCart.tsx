import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

const CartContext = createContext<CartContextData>({} as CartContextData)

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
      // TODO
      // * Get product data
      const { data } = await api.get(`/products/${productId}`)
      const productInCart = cart.find(product => product.id === productId)

      if(productInCart) {
        const { id, amount} = productInCart
        const productAmountData = { productId: id, amount: amount + 1 }
        updateProductAmount(productAmountData)
      } else {
        const productData: Product = {
          ...data,
          amount: 1
        }
        const productsCart = [...cart, productData]
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsCart))
        setCart(productsCart)
      }
    } catch {
      // TODO
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productInCart = cart.find(product => product.id === productId)

      if(!productInCart){
        toast.error('Erro na remoção do produto')
        throw new Error("Erro na remoção do produto")
      }

      // TODO
      const newCart = cart.filter(product => product.id !== productId)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
    } catch {
      // TODO
       toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({productId, amount}: UpdateProductAmount ) => {
    try {
      // TODO

      if (amount < 1) {
        throw new Error('Alteraçáo inválida')
      }

      const { data } = await api.get(`/stock/${productId}`)
      const limit = data.amount

      if(amount > limit) {
        toast.error('Quantidade solicitada fora de estoque')
      } else {
        const newCart:Product[] = cart.map(product => {
          if (product.id === productId){
            return {
              ...product,
              amount
            }
          }
          return product
        })
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)
      }
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto')
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
  const context = useContext(CartContext);

  return context;
}
