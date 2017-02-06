'use strict';

import { TsLinter } from './tsLinter';

new TsLinter()
  .lint()
  .map((j) => JSON.stringify(j))
  .map((json) => `${json}\u0000`)
  .subscribe((line) => console.log(line));
