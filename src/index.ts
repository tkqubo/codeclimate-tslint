'use strict';
import {TsLinter} from './tsLinter';

new TsLinter()
  .lint()
  .map(JSON.stringify)
  .map(json => `${json}\u0000`)
  .subscribe(line => console.log(line))
;

