/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { RemoveFromWishlistDto } from './dto/remove-from-wishlist.dto';
import { MoveToCartDto } from './dto/move-to-cart.dto';

import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async getWishlist(userId: number) {
    return this.wishlistRepo.find({
      where: { user: { id: userId.toString() } }, // convert number to string
    });
  }

  async add(user: User, dto: AddToWishlistDto) {
    const product = await this.productRepo.findOneBy({
      id: dto.productId.toString(),
    });
    if (!product) throw new NotFoundException('Product not found');

    const exists = await this.wishlistRepo.findOneBy({ user, product });
    if (exists) return exists;

    const entry = this.wishlistRepo.create({ user, product });
    return this.wishlistRepo.save(entry);
  }

  async remove(user: User, dto: RemoveFromWishlistDto) {
    const product = await this.productRepo.findOneBy({
      id: dto.productId.toString(),
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.wishlistRepo.delete({ user, product });
    return { success: true };
  }

  share(user: User) {
    const link = `https://myshop.com/wishlist/${user.id}`;
    return { link };
  }

  async moveToCart(user: User, dto: MoveToCartDto) {
    const product = await this.productRepo.findOneBy({
      id: dto.productId.toString(),
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.remove(user, { productId: dto.productId });
    return { message: 'Moved to cart' };
  }

  async notifyUsersOnProductUpdate(
    productId: number,
    type: 'priceDrop' | 'restock',
  ) {
    const wishlists = await this.wishlistRepo.find({
      where: { product: { id: productId.toString() } },
      relations: ['user'],
    });

    for (const entry of wishlists) {
      console.log(
        `Notify ${entry.user.email} about ${type} on product ${productId}`,
      );
    }
  }
}
