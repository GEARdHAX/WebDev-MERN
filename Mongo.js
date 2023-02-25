// establishing connection with mongoose :-
const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Kitchen');
}
// Constrcting FridgeRack for storage of data(food) :-
const FridgeRack = new mongoose.Schema({
  name: String,
  piece: Number,
  price: Number
});

// Create a new Fride from the FridgeMold and FridgeRack :-
const Fridge = mongoose.model('FridgeMold', FridgeRack);

// Putting data(food) to our new Fride :-
const Food = new Fridge({
  name: 'Gulab Jamun',
  piece: 69,
  price: 200
});

// Packing(save) our Food inside Fride :-
Food.save((err, result) => {
  if (err) {
    console.log(err);
  } else {
    console.log(result);
  }
});
Fridge.find((err, results) => {
 if (err) {
   console.log(err);
 } else {
   console.log(results);
 }
});
