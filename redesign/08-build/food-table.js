/* THE FOOD TABLE, AND THE UNITS IT IS MEASURED IN.

   Reference data: what a gram of each thing carries, what "a slice" and
   "a glass" weigh, and three barcodes. Not one person's meals -- those are
   in fixtures.js with the rest of the seed, and the shipped build is right
   to drop them.

   IT WAS DROPPED WITH THEM, and everything that reads a table died quietly
   on every real account: searching "chicken" returned nothing and the sheet
   said "0 foods across this build's table"; every barcode read Not found;
   the portion sheet could not be opened at all, because the control that
   opens it is gated on a key only a table row has, so a food could only
   ever be logged at its default serving; and the sentence reader kept the
   bare unit out of "200 g chicken" -- it strips digits and looks the unit
   up here -- so three foods became one row called "g chicken g rice".

   Eight foods is a demo table and the screens say so. The unit map is the
   part that matters most: it is what turns what somebody typed into grams.
*/
(function (g) {
  g.LKFoodTable = {
  "targets": {
    "kcal": 2980,
    "pro": 160,
    "carb": 380,
    "fat": 80,
    "waterMl": 3000
  },
  "microRef": {
    "fibre": 30,
    "sugar": 90,
    "satfat": 20,
    "sodium": 2400
  },
  "unitG": {
    "g": 1,
    "gram": 1,
    "grams": 1,
    "kg": 1000,
    "kilo": 1000,
    "kilos": 1000,
    "ml": 1,
    "l": 1000,
    "litre": 1000,
    "litres": 1000,
    "oz": 28.35,
    "lb": 453.6,
    "tbsp": 15,
    "tablespoon": 15,
    "tablespoons": 15,
    "tsp": 5,
    "teaspoon": 5,
    "teaspoons": 5,
    "cup": 240,
    "cups": 240,
    "scoop": 30,
    "scoops": 30,
    "slice": 35,
    "slices": 35,
    "serving": 0,
    "servings": 0,
    "plate": 0,
    "plates": 0,
    "portion": 0,
    "portions": 0
  },
  "barcodes": {
    "5060123456789": "skyr",
    "5012345678900": "shake",
    "5000112345678": "pancakes"
  },
  "foods": {
    "eggs": {
      "icon": "🍳",
      "name": "Eggs, toast, butter",
      "kcal": 540,
      "pro": 38,
      "carb": 46,
      "fat": 24,
      "g": 260,
      "fibre": 4,
      "sugar": 5,
      "satfat": 9,
      "sodium": 720,
      "alias": [
        "egg",
        "eggs",
        "toast",
        "eggs and toast",
        "eggs on toast",
        "fry up"
      ],
      "parts": [
        "egg",
        "eggs",
        "toast"
      ]
    },
    "bowl": {
      "icon": "🥗",
      "name": "Chicken rice bowl",
      "kcal": 720,
      "pro": 52,
      "carb": 84,
      "fat": 16,
      "g": 450,
      "fibre": 6,
      "sugar": 8,
      "satfat": 4,
      "sodium": 980,
      "alias": [
        "rice bowl",
        "chicken bowl",
        "chicken rice bowl",
        "burrito bowl",
        "bowl"
      ],
      "parts": []
    },
    "shake": {
      "icon": "🥤",
      "name": "Whey shake, banana",
      "kcal": 310,
      "pro": 31,
      "carb": 38,
      "fat": 4,
      "g": 400,
      "fibre": 3,
      "sugar": 24,
      "satfat": 1.5,
      "sodium": 210,
      "alias": [
        "shake",
        "whey",
        "protein shake",
        "whey shake",
        "smoothie"
      ],
      "parts": [
        "whey"
      ],
      "barcode": "5012345678900"
    },
    "pasta": {
      "icon": "🍝",
      "name": "Beef mince and pasta",
      "kcal": 810,
      "pro": 48,
      "carb": 92,
      "fat": 26,
      "g": 520,
      "fibre": 7,
      "sugar": 11,
      "satfat": 10,
      "sodium": 890,
      "alias": [
        "pasta",
        "spaghetti",
        "bolognese",
        "mince and pasta",
        "beef pasta"
      ],
      "parts": []
    },
    "chilli": {
      "icon": "🍲",
      "name": "Chilli",
      "kcal": 530,
      "pro": 41,
      "carb": 38,
      "fat": 18,
      "g": 400,
      "fibre": 11,
      "sugar": 9,
      "satfat": 6,
      "sodium": 760,
      "alias": [
        "chilli",
        "chili",
        "chilli con carne"
      ],
      "parts": []
    },
    "cnr": {
      "icon": "🍚",
      "name": "Chicken and rice",
      "kcal": 690,
      "pro": 61,
      "carb": 74,
      "fat": 13,
      "g": 480,
      "fibre": 3,
      "sugar": 3,
      "satfat": 3.5,
      "sodium": 640,
      "alias": [
        "chicken and rice",
        "chicken rice",
        "chicken n rice"
      ],
      "parts": []
    },
    "pancakes": {
      "icon": "🥞",
      "name": "Protein pancakes",
      "kcal": 360,
      "pro": 31,
      "carb": 37,
      "fat": 8,
      "g": 220,
      "fibre": 5,
      "sugar": 7,
      "satfat": 2,
      "sodium": 380,
      "alias": [
        "pancakes",
        "pancake",
        "protein pancakes"
      ],
      "parts": [
        "pancake",
        "pancakes"
      ],
      "barcode": "5000112345678"
    },
    "skyr": {
      "icon": "🥫",
      "name": "Skyr, plain",
      "kcal": 96,
      "pro": 17,
      "carb": 6,
      "fat": 0.3,
      "g": 170,
      "fibre": 0,
      "sugar": 6,
      "satfat": 0.1,
      "sodium": 65,
      "alias": [
        "skyr",
        "yoghurt",
        "yogurt",
        "greek yoghurt",
        "quark"
      ],
      "parts": [],
      "barcode": "5060123456789"
    }
  }
};
}(typeof window !== 'undefined' ? window : this));
