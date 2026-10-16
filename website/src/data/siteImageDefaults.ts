import type { HomepageSlot } from '../api/homepage'

/**
 * What each fixed spot shows until an admin replaces it in Site Images: a photo,
 * or for `hero_video` the homepage video that ships with the site
 * (the design's original placeholders). Pages fall back to these whenever the saved
 * version hasn't loaded, failed, or was never set, and the admin uses them to preview
 * what a spot currently shows. Typed against HomepageSlot, so a new spot can't be
 * added without a default.
 */
export const SITE_IMAGE_DEFAULTS: Record<HomepageSlot, string> = {
  hero_video: '/videos/hero.mp4',
  hero_poster:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Acacia_tree_on_a_sunrise_safari_at_the_Serengeti_National_Park%2C_Tanzania.jpg/1280px-Acacia_tree_on_a_sunrise_safari_at_the_Serengeti_National_Park%2C_Tanzania.jpg',
  why_choose:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Ngorongoro_jeep_safari_%2827333740440%29.jpg/1280px-Ngorongoro_jeep_safari_%2827333740440%29.jpg',
  testimonial_sarah:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBFIMzrREe_jcC3X0qovnWDaglzRGvVy0TWU8RkvZ8FJFjt-G5ui8oQjFLRe3CjGQe2MWNdqNmotnl0vlV60AzI9bMFWwk2Q2eK5OjTg-v-gmsruDqc-NYDmoFI8Z5vwRsPWq1OlFUbnLj_zrLqx3krWRcM6QldqT6dEiHrROyL29Ks4Bdym0GDriAjvrOfWr3vdON_EefgGk_D94U9rguoRtCUh5hZdfcgEE7999SG7KSS1R32gbmq',
  testimonial_markus:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCDRcYLtsIkom74XG5p6jZlqurQPzqTawzyhwQ6VXrrML45M24gF6_2XWFN9-a94dapRlzTqElUJ7UjxxyQuKE6SnAbUzrCjiczFOjpgbOZusViypZ-6K0Dl10Ox4FWyVTMexcAn2w_0U7rOHLYR3auBrDSGUthdHkhP48mSb2CswDWp9H7Dv5ckSe4T5Y2tLLzjuHSCKkT3ed6U1caTHsIIeNswwZpmrf8GSvDrf3zz5FL90q6PW_Z',
  about_hero:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Mount_Kilimanjaro_from_Moshi.jpg/1280px-Mount_Kilimanjaro_from_Moshi.jpg',
  about_story:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Silhouette_of_Tree%2C_morning_at_Ngorongoro_Crater.jpg/1280px-Silhouette_of_Tree%2C_morning_at_Ngorongoro_Crater.jpg',
  safaris_hero:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Serengeti_wildebeest_migration_JF.jpg/1280px-Serengeti_wildebeest_migration_JF.jpg',
  faqs_hero:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Serengeti_Sunrise_Beams.jpg/1280px-Serengeti_Sunrise_Beams.jpg',
  sign_in:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Ngorongoro-Crater-Morning-Scene.JPG/1280px-Ngorongoro-Crater-Morning-Scene.JPG',
  booking_confirmed_hero:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Serengeti_Sunset.jpg/1280px-Serengeti_Sunset.jpg',
  booking_confirmed_packing:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Western_Serengeti_2012_06_02_4042_%287557756124%29.jpg/1280px-Western_Serengeti_2012_06_02_4042_%287557756124%29.jpg',
  booking_confirmed_photography:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Serengeti_National_Park_08_-_lion_-_Panthera_leo.jpg/1280px-Serengeti_National_Park_08_-_lion_-_Panthera_leo.jpg',
}
