<script setup lang="ts">
const route = useRoute();
const { data: product, pending, error } = await useProduct(route.params.id as string);

const activePhotoIndex = ref(0);

const allPhotos = computed(() => {
  if (!product.value) return [];
  return [product.value.photos[0], ...product.value.extraPhotos].filter((p): p is string => Boolean(p));
});

const activePhotoUrl = computed(() => photoVariantUrl(allPhotos.value[activePhotoIndex.value], 'gallery'));

const whatsappUrl = computed(() => {
  const seller = product.value?.seller;
  if (!seller) return undefined;
  if (seller.whatsapp) return seller.whatsapp;
  const phone = seller.contactPhone;
  return phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : undefined;
});

type SocialKey = 'whatsapp' | 'telegram' | 'instagram';

const SOCIAL_ICON_PATHS: Record<SocialKey, string> = {
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741 1.352 1.36-3.607-.235-.368a9.86 9.86 0 0 1-1.51-5.234c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884M20.552 3.449C18.24 1.245 15.24 0 12.05 0 5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.86 11.86 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.39-8.452',
  telegram:
    'M11.944 0A12 12 0 1 0 12 24a12 12 0 0 0-.056-24zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  instagram:
    'M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.846-10.405a1.44 1.44 0 1 1-2.881.001 1.44 1.44 0 0 1 2.881-.001z',
};

const socialLinks = computed(() => {
  const seller = product.value?.seller;
  if (!seller) return [];
  const entries: { key: SocialKey; url: string; label: string }[] = [
    { key: 'whatsapp', url: whatsappUrl.value ?? '', label: 'Написать в WhatsApp' },
    { key: 'telegram', url: seller.telegramContact ?? '', label: 'Написать в Telegram' },
    { key: 'instagram', url: seller.instagram ?? '', label: 'Открыть Instagram' },
  ];
  return entries.filter((entry) => entry.url);
});
</script>

<template>
  <div class="pd">
    <div class="pd__container">
      <NuxtLink to="/" class="pd__back">← Назад к каталогу</NuxtLink>

      <div v-if="pending" class="pd__state">Загрузка…</div>
      <div v-else-if="error || !product" class="pd__state pd__state--error">Товар не найден.</div>

      <div v-else class="pd__grid">
        <div>
          <div class="pd__image-wrap" :class="{ 'pd__image-wrap--oos': !product.inStock }">
            <span v-if="!product.inStock" class="pd__oos-badge">Нет в наличии</span>
            <img :src="activePhotoUrl" :alt="product.title" class="pd__image" />
          </div>

          <div v-if="allPhotos.length > 1" class="pd__thumbs">
            <button
              v-for="(photo, index) in allPhotos"
              :key="photo"
              type="button"
              class="pd__thumb"
              :class="{ 'pd__thumb--active': index === activePhotoIndex }"
              @click="activePhotoIndex = index"
            >
              <img :src="photoVariantUrl(photo, 'thumb')" :alt="`${product.title} ${index + 1}`" />
            </button>
          </div>
        </div>

        <div class="pd__info">
          <h1 class="pd__title">{{ product.title }}</h1>
          <p class="pd__category">{{ product.category.name }}</p>
          <p class="pd__price">{{ Number(product.price).toLocaleString('ru-RU') }} {{ product.currency }}</p>

          <p v-if="product.description" class="pd__desc">{{ product.description }}</p>

          <div v-if="product.sizes?.length" class="pd__attr">
            <h3 class="pd__attr-label">Размеры</h3>
            <div class="pd__chips">
              <span v-for="s in product.sizes" :key="s" class="pd__chip">{{ s }}</span>
            </div>
          </div>

          <div v-if="product.colors?.length" class="pd__attr">
            <h3 class="pd__attr-label">Цвета</h3>
            <div class="pd__chips">
              <span v-for="c in product.colors" :key="c" class="pd__chip">{{ c }}</span>
            </div>
          </div>

          <div class="pd__seller">
            <img v-if="product.seller.logoUrl" :src="product.seller.logoUrl" class="pd__seller-logo" :alt="product.seller.name" />
            <div>
              <p class="pd__seller-name">{{ product.seller.name }}</p>
              <p class="pd__seller-rating">★ {{ product.seller.rating.toFixed(1) }}</p>
            </div>
          </div>

          <a v-if="product.sellerUrl" :href="product.sellerUrl" target="_blank" rel="noopener noreferrer" class="pd__cta">
            Купить у продавца →
          </a>

          <div v-if="socialLinks.length" class="pd__social-buttons">
            <a
              v-for="link in socialLinks"
              :key="link.key"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="pd__social-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path :d="SOCIAL_ICON_PATHS[link.key]" />
              </svg>
              <span>{{ link.label }} →</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pd {
  &__container {
    @include container;
    padding-block: 2rem;
  }

  &__back {
    display: inline-block;
    font-size: 0.875rem;
    color: $stone-400;
    margin-bottom: 1.5rem;
    transition: color 0.2s;

    &:hover { color: $lime-400; }
  }

  &__state {
    padding-block: 3rem;
    color: $stone-500;

    &--error { color: #f87171; }
  }

  &__grid {
    display: grid;
    gap: 2rem;

    @include r($bp-md) {
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
    }
  }

  &__image-wrap {
    position: relative;
    aspect-ratio: 3 / 4;
    border-radius: 1rem;
    overflow: hidden;
    outline: 1px solid rgba(255, 255, 255, 0.1);
    outline-offset: -1px;

    &--oos { opacity: 0.6; }
  }

  &__oos-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 1;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    color: $stone-200;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
  }

  &__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__thumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  &__thumb {
    position: relative;
    width: 4rem;
    aspect-ratio: 3 / 4;
    border-radius: 0.5rem;
    overflow: hidden;
    outline: 2px solid transparent;
    outline-offset: -2px;
    opacity: 0.6;
    transition: opacity 0.2s, outline-color 0.2s;

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &:hover { opacity: 0.9; }

    &--active {
      opacity: 1;
      outline-color: $lime-400;
    }
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;

    @include r($bp-sm) { font-size: 1.875rem; }
  }

  &__category {
    font-size: 0.875rem;
    color: $stone-500;
    margin-top: 0.25rem;
  }

  &__price {
    font-size: 1.875rem;
    font-weight: 700;
    color: $lime-400;
    margin-top: 1rem;
  }

  &__desc {
    font-size: 0.9375rem;
    color: $stone-300;
    line-height: 1.6;
    margin-top: 1rem;
  }

  &__attr {
    margin-top: 1rem;
  }

  &__attr-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $stone-400;
    margin-bottom: 0.5rem;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__chip {
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    @include glass;
  }

  &__seller {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 1rem;
    @include glass;
  }

  &__seller-logo {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__seller-name {
    font-weight: 600;
    font-size: 0.9375rem;
  }

  &__seller-rating {
    font-size: 0.875rem;
    color: $stone-500;
    margin-top: 0.125rem;
  }

  &__social-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  &__social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    color: $stone-100;
    font-weight: 700;
    font-size: 1rem;
    @include glass;
    transition: color 0.2s, transform 0.2s;

    &:hover {
      color: $lime-400;
      transform: translateY(-2px);
    }
  }

  &__cta {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.5rem;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    background-color: $lime-400;
    color: $ink-900;
    font-weight: 700;
    font-size: 1rem;
    transition: background-color 0.2s;

    &:hover { background-color: $lime-300; }

    @include r($bp-sm) {
      width: fit-content;
    }
  }
}
</style>
