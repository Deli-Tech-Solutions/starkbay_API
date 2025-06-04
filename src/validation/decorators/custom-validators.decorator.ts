import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
          const isLongEnough = value.length >= 8;
          
          return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters';
        }
      }
    });
  };
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
          return phoneRegex.test(value.replace(/\s/g, ''));
        },
        defaultMessage(args: ValidationArguments) {
          return 'Phone number must be a valid format';
        }
      }
    });
  };
}

export function IsUniqueField(field: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueField',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [field],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // This would typically check against a database
          // Implementation depends on your ORM/database setup
          return true; // Placeholder
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.constraints[0]} must be unique`;
        }
      }
    });
  };
}

export function IsNotProfane(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotProfane',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return true;
          
          const profaneWords = ['badword1', 'badword2']; // Add your list
          const lowercaseValue = value.toLowerCase();
          
          return !profaneWords.some(word => lowercaseValue.includes(word));
        },
        defaultMessage(args: ValidationArguments) {
          return 'Content contains inappropriate language';
        }
      }
    });
  };
}
