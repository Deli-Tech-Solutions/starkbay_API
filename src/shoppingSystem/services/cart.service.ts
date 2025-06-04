import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { RemoveFromCartDto } from '../dto/remove-from-cart.dto';
import { CartCalculation, CartTotals } from '../interfaces/cart-calculation.interface';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
    let cart: Cart;

    if (userId) {
      cart = await this.cartRepository.findOne({
        where: { userId, isActive: true },
        relations: ['items', 'items.product'],
      });
    } else if (sessionId) {
      cart = await this.cartRepository.findOne({
        where: { sessionId, isActive: true },
        relations: ['items', 'items.product'],
      });
    }

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        sessionId,
        expiresAt: this.getCartExpirationDate(),
      });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(addToCartDto: AddToCartDto, userId?: string, sessionId?: string): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    let existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * product.price;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: product.price,
        totalPrice: quantity * product.price,
      });
      await this.cartItemRepository.save(newItem);
    }

    await this.updateCartTotals(cart.id);
    return this.getCartById(cart.id);
  }

  async updateCartItem(updateCartItemDto: UpdateCartItemDto, userId?: string, sessionId?: string): Promise<Cart> {
    const { cartItemId, quantity } = updateCartItemDto;

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (userId && cartItem.cart.userId !== userId) {
      throw new BadRequestException('Unauthorized access to cart item');
    }

    if (sessionId && cartItem.cart.sessionId !== sessionId) {
      throw new BadRequestException('Unauthorized access to cart item');
    }

    if (cartItem.product.stock < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cartItem.quantity = quantity;
    cartItem.totalPrice = quantity * cartItem.unitPrice;
    await this.cartItemRepository.save(cartItem);

    await this.updateCartTotals(cartItem.cart.id);
    return this.getCartById(cartItem.cart.id);
  }

  async removeFromCart(removeFromCartDto: RemoveFromCartDto, userId?: string, sessionId?: string): Promise<Cart> {
    const { cartItemId } = removeFromCartDto;

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['cart'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (userId && cartItem.cart.userId !== userId) {
      throw new BadRequestException('Unauthorized access to cart item');
    }

    if (sessionId && cartItem.cart.sessionId !== sessionId) {
      throw new BadRequestException('Unauthorized access to cart item');
    }

    const cartId = cartItem.cart.id;
    await this.cartItemRepository.remove(cartItem);

    await this.updateCartTotals(cartId);
    return this.getCartById(cartId);
  }

  async getCart(userId?: string, sessionId?: string): Promise<Cart | null> {
    if (userId) {
      return this.cartRepository.findOne({
        where: { userId, isActive: true },
        relations: ['items', 'items.product'],
      });
    } else if (sessionId) {
      return this.cartRepository.findOne({
        where: { sessionId, isActive: true },
        relations: ['items', 'items.product'],
      });
    }
    return null;
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const cart = await this.getCart(userId, sessionId);
    if (cart) {
      await this.cartItemRepository.delete({ cartId: cart.id });
      await this.updateCartTotals(cart.id);
    }
  }

  async mergeGuestCartWithUserCart(guestSessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.cartRepository.findOne({
      where: { sessionId: guestSessionId, isActive: true },
      relations: ['items'],
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    for (const guestItem of guestCart.items) {
      const existingUserItem = await this.cartItemRepository.findOne({
        where: { cartId: userCart.id, productId: guestItem.productId },
      });

      if (existingUserItem) {
        existingUserItem.quantity += guestItem.quantity;
        existingUserItem.totalPrice = existingUserItem.quantity * existingUserItem.unitPrice;
        await this.cartItemRepository.save(existingUserItem);
      } else {
        guestItem.cartId = userCart.id;
        await this.cartItemRepository.save(guestItem);
      }
    }

    guestCart.isActive = false;
    await this.cartRepository.save(guestCart);

    await this.updateCartTotals(userCart.id);
    return this.getCartById(userCart.id);
  }

  async cleanupExpiredCarts(): Promise<void> {
    const expiredCarts = await this.cartRepository.find({
      where: { isActive: true },
    });

    const now = new Date();
    const cartsToDeactivate = expiredCarts.filter(cart => 
      cart.expiresAt && cart.expiresAt < now
    );

    for (const cart of cartsToDeactivate) {
      cart.isActive = false;
      await this.cartRepository.save(cart);
    }
  }

  private async getCartById(cartId: string): Promise<Cart> {
    return this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items', 'items.product'],
    });
  }

  private async updateCartTotals(cartId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) return;

    const calculation = this.calculateCartTotals(cart.items);
    
    cart.subtotal = calculation.subtotal;
    cart.taxAmount = calculation.taxAmount;
    cart.discountAmount = calculation.discountAmount;
    cart.total = calculation.total;
    cart.expiresAt = this.getCartExpirationDate();

    await this.cartRepository.save(cart);
  }

  private calculateCartTotals(items: CartItem[]): CartCalculation {
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const taxRate = 0.08; // 8% tax rate
    const taxAmount = subtotal * taxRate;
    const discountAmount = 0; // Implement discount logic here
    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  private getCartExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
    return expirationDate;
  }

  async getCartTotals(userId?: string, sessionId?: string): Promise<CartTotals> {
    const cart = await this.getCart(userId, sessionId);
    
    if (!cart) {
      return {
        itemCount: 0,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
      };
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      itemCount,
      subtotal: Number(cart.subtotal),
      taxAmount: Number(cart.taxAmount),
      discountAmount: Number(cart.discountAmount),
      total: Number(cart.total),
    };
  }
}