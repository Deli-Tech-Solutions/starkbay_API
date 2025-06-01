/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Body, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { RemoveFromWishlistDto } from './dto/remove-from-wishlist.dto';
import { MoveToCartDto } from './dto/move-to-cart.dto';
import { User } from 'src/user/user.entity';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() req: { user: { id: number } }) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post()
  addToWishlist(@Req() req: { user: User }, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.add(req.user, dto);
  }

  @Delete()
  removeFromWishlist(
    @Req() req: { user: User },
    @Body() dto: RemoveFromWishlistDto,
  ) {
    return this.wishlistService.remove(req.user, dto);
  }

  @Post('share')
  shareWishlist(@Req() req: { user: User }) {
    return this.wishlistService.share(req.user);
  }

  @Post('move-to-cart')
  moveToCart(@Req() req: { user: User }, @Body() dto: MoveToCartDto) {
    return this.wishlistService.moveToCart(req.user, dto);
  }
}
