import { Scenes } from 'telegraf';

export type BotContext = Scenes.SceneContext;

export interface AddProductState {
  stepIndex: number;
  messageIds: number[];
  currentStepMessageId?: number;
  currentOptions?: string[];
  categoryId?: string;
  categorySlug?: string;
  subtype?: string;
  brand?: string;
  originCountry?: string;
  price?: string;
  currency?: string;
  materials: string[];
  colors: string[];
  sizes: string[];
  mainPhotoFileId?: string;
  description?: string | null;
  extraPhotoFileIds: string[];
  extraPhotoConfirmMessageIds?: number[];
  awaitingCustomInput?: boolean;
}

export interface EditProductState {
  productId: string;
  awaitingField?: 'price' | 'description';
  awaitingCustomFor?: 'brand' | 'country' | 'materials' | 'colors' | 'sizes';
  draftMaterials?: string[];
  draftColors?: string[];
  draftSizes?: string[];
  currentOptions?: string[];
  awaitingExtraPhotos?: boolean;
  messageIds: number[];
  currentStepMessageId?: number;
}

export const ADD_PRODUCT_SCENE_ID = 'add-product';
export const EDIT_PRODUCT_SCENE_ID = 'edit-product';
