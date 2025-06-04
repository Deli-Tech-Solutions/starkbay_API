// productEntity/utils/slug.util.ts
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export function generateSeoTitle(productName: string, category?: string): string {
  const baseTitle = productName;
  const suffix = category ? ` | ${category}` : ' | E-commerce Store';
  
  if (baseTitle.length + suffix.length <= 60) {
    return baseTitle + suffix;
  }
  
  return baseTitle.substring(0, 60 - suffix.length).trim() + suffix;
}

export function generateSeoDescription(product: {
  name: string;
  shortDescription?: string;
  price: number;
  currency: string;
}): string {
  const { name, shortDescription, price, currency } = product;
  
  let description = `Buy ${name}`;
  
  if (shortDescription) {
    description += ` - ${shortDescription}`;
  }
  
  description += ` for ${currency} ${price}. Free shipping available.`;
  
  return description.length <= 160 
    ? description 
    : description.substring(0, 157) + '...';
}

