import { Controller, Get, Post, Put, Delete, Body, Req, UseInterceptors, Session } from '@nestjs/common';
import { Request } from 'express';
import { CartService } from '../services/cart.service';
import { AddToCartDto } from '../dto/add-to-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { RemoveFromCartDto } from '../dto/remove-from-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: Request, @Session() session: Record<string, any>) {
    const userId = req.user?.id;
    const sessionId = session.id;
    return this.cartService.getCart(userId, sessionId);
  }

  @Get('totals')
  async getCartTotals(@Req() req: Request, @Session() session: Record<string, any>) {
    const userId = req.user?.id;
    const sessionId = session.id;
    return this.cartService.getCartTotals(userId, sessionId);
  }

  @Post('add')
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Req() req: Request,
    @Session() session: Record<string, any>
  ) {
    const userId = req.user?.id;
    const sessionId = session.id;
    return this.cartService.addToCart(addToCartDto, userId, sessionId);
  }

  @Put('update')
  async updateCartItem(
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Req() req: Request,
    @Session() session: Record<string, any>
  ) {
    const userId = req.user?.id;
    const sessionId = session.id;
    return this.cartService.updateCartItem(updateCartItemDto, userId, sessionId);
  }

  @Delete('remove')
  async removeFromCart(
    @Body() removeFromCartDto: RemoveFromCartDto,
    @Req() req: Request,
    @Session() session: Record<string, any>
  ) {
    const userId = req.user?.id;
    const sessionId = session.id;
    return this.cartService.removeFromCart(removeFromCartDto, userId, sessionId);
  }

  @Delete('clear')
  async clearCart(@Req() req: Request, @Session() session: Record<string, any>) {
    const userId = req.user?.id;
    const sessionId = session.id;
    return this.cartService.clearCart(userId, sessionId);
  }

  @Post('merge')
  async mergeGuestCart(@Req() req: Request, @Session() session: Record<string, any>) {
    const userId = req.user?.id;
    const sessionId = session.id;
    
    if (!userId) {
      throw new Error('User must be logged in to merge cart');
    }

    return this.cartService.mergeGuestCartWithUserCart(sessionId, userId);
  }
}
