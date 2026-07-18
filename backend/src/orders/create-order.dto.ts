import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  size?: string | null;

  @IsOptional()
  @IsString()
  color?: string | null;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  items: CreateOrderItemDto[];
}
