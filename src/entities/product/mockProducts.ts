import type { Category, Product } from "./types";

// Content matches Figma node 677:4812 (Product Grid Container) 1:1.
export const mockProducts: Product[] = [
  { id: "1", title: "Металлический стол by Rhyme", price: "18 924 ₽", image: "/images/home-screen/product-table.avif" },
  { id: "2", title: "Тарелка Villeroy & Boch Design Naif", price: "4 300 ₽", image: "/images/home-screen/product-plate.avif" },
  { id: "3", title: "FIAT Topolino 1.4 MT, 2018, 111 442 км", price: "990 000 ₽", image: "/images/home-screen/product-car.avif" },
  { id: "4", title: "Компьютерная мышь Puxiang's", price: "10 399 ₽", image: "/images/home-screen/product-mouse.avif" },
  { id: "5", title: "Вечернее платье Lichi, Размер S", price: "5 500 ₽", image: "/images/home-screen/product-dress.avif" },
  { id: "6", title: "Футболка GAP", price: "3 690 ₽", image: "/images/home-screen/product-tshirt.avif" },
];

// Card widths match Figma exactly (nodes 677:4901–677:4930); height is a
// uniform 68px. Longer two-line titles ("Недвижимость", "Жильё для
// путешествий") get 99px cards, everything else is 72–74px. Line breaks
// (\n) match Figma's own manual breaks exactly, incl. the hyphenated
// "Недвижи-\nмость" / "Электро-\nника" — those two words don't fit their
// card width unbroken, and a browser auto-wrap/break-word would hyphenate
// at the wrong point (or overflow) instead of Figma's chosen break.
export const mockCategories: Category[] = [
  { id: "all", title: "Все", image: "/images/home-screen/category-all.avif", width: 74 },
  { id: "realestate", title: "Недвижи-\nмость", image: "/images/home-screen/category-realestate.avif", width: 99 },
  { id: "travel", title: "Жильё для\nпутешествий", image: "/images/home-screen/category-travel.avif", width: 99 },
  { id: "spareparts", title: "Запчасти", image: "/images/home-screen/category-spareparts.avif", width: 72 },
  { id: "auto", title: "Авто", image: "/images/home-screen/category-auto.avif", width: 74 },
  { id: "electronics", title: "Электро-\nника", image: "/images/home-screen/category-electronics.avif", width: 74 },
  { id: "services", title: "Услуги", image: "/images/home-screen/category-services.avif", width: 73 },
  { id: "job", title: "Работа", image: "/images/home-screen/category-job.avif", width: 73 },
  { id: "business", title: "Бизнес\n360", image: "/images/home-screen/category-business.avif", width: 73 },
];
