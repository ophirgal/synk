// declare const require: {
//   context(
//     directory: string,
//     useSubdirectories?: boolean,
//     regExp?: RegExp,
//   ): __WebpackModuleApi.RequireContext;
// };

export type ReactAnimalNames =
  | 'alligator'
  | 'anteater'
  | 'armadillo'
  | 'auroch'
  | 'axolotl'
  | 'badger'
  | 'bat'
  | 'beaver'
  | 'buffalo'
  | 'camel'
  | 'capybara'
  | 'chameleon'
  | 'cheetah'
  | 'chinchilla'
  | 'chipmunk'
  | 'chupacabra'
  | 'cormorant'
  | 'coyote'
  | 'crow'
  | 'dingo'
  | 'dinosaur'
  | 'dolphin'
  | 'duck'
  | 'elephant'
  | 'ferret'
  | 'fox'
  | 'frog'
  | 'giraffe'
  | 'gopher'
  | 'grizzly'
  | 'hedgehog'
  | 'hippo'
  | 'hyena'
  | 'ibex'
  | 'ifrit'
  | 'iguana'
  | 'jackal'
  | 'kangaroo'
  | 'koala'
  | 'kraken'
  | 'lemur'
  | 'leopard'
  | 'liger'
  | 'llama'
  | 'manatee'
  | 'mink'
  | 'monkey'
  | 'moose'
  | 'narwhal'
  | 'orangutan'
  | 'otter'
  | 'panda'
  | 'penguin'
  | 'platypus'
  | 'pumpkin'
  | 'python'
  | 'quagga'
  | 'rabbit'
  | 'raccoon'
  | 'rhino'
  | 'sheep'
  | 'shrew'
  | 'skunk'
  | 'squirrel'
  | 'tiger'
  | 'turtle'
  | 'walrus'
  | 'wolf'
  | 'wolverine'
  | 'wombat';

// const animalImages = require.context('./images', false, /\.png$/);
const getImage = (filename: string) => {
  return new URL(`animal-avatars/${filename}`, window.origin).href
};

// const getImage = (path: string) => {
//   const image = animalImages(path);
//   return image.default || image;
// }

export const animalImageMap: Record<ReactAnimalNames, string> = {
  alligator: getImage('alligator.png'),
  anteater: getImage('anteater.png'),
  armadillo: getImage('armadillo.png'),
  auroch: getImage('auroch.png'),
  axolotl: getImage('axolotl.png'),
  badger: getImage('badger.png'),
  bat: getImage('bat.png'),
  beaver: getImage('beaver.png'),
  buffalo: getImage('buffalo.png'),
  camel: getImage('camel.png'),
  capybara: getImage('capybara.png'),
  chameleon: getImage('chameleon.png'),
  cheetah: getImage('cheetah.png'),
  chinchilla: getImage('chinchilla.png'),
  chipmunk: getImage('chipmunk.png'),
  chupacabra: getImage('chupacabra.png'),
  cormorant: getImage('cormorant.png'),
  coyote: getImage('coyote.png'),
  crow: getImage('crow.png'),
  dingo: getImage('dingo.png'),
  dinosaur: getImage('dinosaur.png'),
  dolphin: getImage('dolphin.png'),
  duck: getImage('duck.png'),
  elephant: getImage('elephant.png'),
  ferret: getImage('ferret.png'),
  fox: getImage('fox.png'),
  frog: getImage('frog.png'),
  giraffe: getImage('giraffe.png'),
  gopher: getImage('gopher.png'),
  grizzly: getImage('grizzly.png'),
  hedgehog: getImage('hedgehog.png'),
  hippo: getImage('hippo.png'),
  hyena: getImage('hyena.png'),
  ibex: getImage('ibex.png'),
  ifrit: getImage('ifrit.png'),
  iguana: getImage('iguana.png'),
  jackal: getImage('jackal.png'),
  kangaroo: getImage('kangaroo.png'),
  koala: getImage('koala.png'),
  kraken: getImage('kraken.png'),
  lemur: getImage('lemur.png'),
  leopard: getImage('leopard.png'),
  liger: getImage('liger.png'),
  llama: getImage('llama.png'),
  manatee: getImage('manatee.png'),
  mink: getImage('mink.png'),
  monkey: getImage('monkey.png'),
  moose: getImage('moose.png'),
  narwhal: getImage('narwhal.png'),
  orangutan: getImage('orangutan.png'),
  otter: getImage('otter.png'),
  panda: getImage('panda.png'),
  penguin: getImage('penguin.png'),
  platypus: getImage('platypus.png'),
  pumpkin: getImage('pumpkin.png'),
  python: getImage('python.png'),
  quagga: getImage('quagga.png'),
  rabbit: getImage('rabbit.png'),
  raccoon: getImage('raccoon.png'),
  rhino: getImage('rhino.png'),
  sheep: getImage('sheep.png'),
  shrew: getImage('shrew.png'),
  skunk: getImage('skunk.png'),
  squirrel: getImage('squirrel.png'),
  tiger: getImage('tiger.png'),
  turtle: getImage('turtle.png'),
  walrus: getImage('walrus.png'),
  wolf: getImage('wolf.png'),
  wolverine: getImage('wolverine.png'),
  wombat: getImage('wombat.png'),
};

export const animalNames = Object.keys(animalImageMap) as ReactAnimalNames[];
