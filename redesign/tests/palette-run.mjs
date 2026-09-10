import { report } from './palette.mjs';
const G = k => k.split(',');
const CURRENT_DARK = { chest:'#FF6B90', back:'#7A95FF', shoulders:'#CB8FFE', calves:'#F17EDA',
  abs:'#F3D149', forearms:'#18DCB5', biceps:'#4CE0F0', triceps:'#7BC6F4',
  hams:'#D4E250', quads:'#67DB24', adduc:'#90D599', glutes:'#29E091' };
const CURRENT_LIGHT = { chest:'#DB5C7C', back:'#6A82DE', shoulders:'#A372CB', calves:'#C366B0',
  abs:'#9B862F', forearms:'#11987D', biceps:'#32949E', triceps:'#588DAE',
  hams:'#848D32', quads:'#489919', adduc:'#629169', glutes:'#1C9963' };
const DARK_G  = { bg:'#0A0A0B', silhouette:'#34343B', muted:'#606069' };
const LIGHT_G = { bg:'#EFEFF2', silhouette:'#A8A8B2', muted:'#83838E' };
report('current, dark', CURRENT_DARK, DARK_G);
report('current, light', CURRENT_LIGHT, LIGHT_G);
