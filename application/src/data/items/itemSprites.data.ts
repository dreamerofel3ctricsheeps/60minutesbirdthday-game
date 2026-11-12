import pinkCakeImg from '@/assets/sprites/items/pink-cake.png';
import smartphoneImg from '@/assets/sprites/items/smartphone.png';
import firstAidImg from '@/assets/sprites/items/first-aid.png';
import boxedTvImg from '@/assets/sprites/items/boxed-tv.png';
import fastFoodImg from '@/assets/sprites/items/fast-food.png';
import tapeImg from '@/assets/sprites/items/tape.png';
import redGiftBoxImg from '@/assets/sprites/items/red-gif-box.png';
import pinkGiftBoxImg from '@/assets/sprites/items/pink-gif-box.png';
import padlockImg from '@/assets/sprites/items/pqdlock.png';
import oldFilmScriptImg from '@/assets/sprites/items/old-film-script.png';
import boxOfBeersImg from '@/assets/sprites/items/box-of-beers.png';
import toolboxImg from '@/assets/sprites/items/toolbox.png';
import aliexpressBoxImg from '@/assets/sprites/items/aliexpress-box.png';
import trashBagsImg from '@/assets/sprites/items/trash-bags.png';
import fullTrashBagsImg from '@/assets/sprites/items/full-trash-bags.png';

export const ITEM_SPRITES: Record<string, string> = {
  birthday_cake: pinkCakeImg,
  smartphone: smartphoneImg,
  first_aid_kit: firstAidImg,
  pro_speaker: boxedTvImg,
  fast_food_box: fastFoodImg,
  tape_roll: tapeImg,
  mystery_gift: redGiftBoxImg,
  neighbor_key: padlockImg,
  luxury_perfume: pinkGiftBoxImg,
  tablet_playlist: oldFilmScriptImg,
  box_of_beers: boxOfBeersImg,
  toolbox: toolboxImg,
  aliexpress_box: aliexpressBoxImg,
  trash_bags: trashBagsImg,
  full_trash_bags: fullTrashBagsImg,
};

export const getItemSpriteUrl = (itemId: string): string => {
  return ITEM_SPRITES[itemId] || ITEM_SPRITES.mystery_gift;
};

// Item visual scale hints for 2.5D rendering (width, height)
export const ITEM_SCALES: Record<string, [number, number]> = {
  birthday_cake: [0.85, 0.85],
  smartphone: [0.55, 0.55],
  first_aid_kit: [0.65, 0.65],
  pro_speaker: [0.85, 0.85],
  fast_food_box: [0.7, 0.7],
  tape_roll: [0.55, 0.55],
  mystery_gift: [0.8, 0.8],
  neighbor_key: [0.55, 0.55],
  luxury_perfume: [0.6, 0.6],
  tablet_playlist: [0.65, 0.65],
  box_of_beers: [0.8, 0.8],
  toolbox: [0.75, 0.75],
  aliexpress_box: [0.8, 0.8],
  trash_bags: [0.85, 0.85],
  full_trash_bags: [0.9, 0.9],
};

export const getItemScale = (itemId: string): [number, number] => {
  return ITEM_SCALES[itemId] || [0.7, 0.7];
};
