// https://github.com/lokesh/quantize/blob/8464efc258b6327d498a1eae02e461746fffdc5e/src/quantize.js

/*
 * quantize.js Copyright 2008 Nick Rabinowitz
 * Ported to node.js by Olivier Lesnicki
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

// fill out a couple protovis dependencies
/*
 * Block below copied from Protovis: http://mbostock.github.com/protovis/
 * Copyright 2010 Stanford Visualization Group
 * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
 */

import { Color } from "../../@types/image";

const pv = {
  naturalOrder: function(a: number, b: number) {
    return a < b ? -1 : a > b ? 1 : 0;
  },
  sum: function(array: number[]) {
    return array.reduce(function(p, d) {
      return p + d;
    }, 0);
  },
  max: function(array: number[]) {
    return Math.max.apply(null, array);
  }
};

/**
 * Basic Javascript port of the MMCQ (modified median cut quantization)
 * algorithm from the Leptonica library (http://www.leptonica.com/).
 * Returns a color map you can use to map original pixels to the reduced
 * palette. Still a work in progress.
 * 
 * @author Nick Rabinowitz
 * @example
 
// array of pixels as [R,G,B] arrays
var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                // etc
                ];
var maxColors = 4;
 
var cmap = MMCQ.quantize(myPixels, maxColors);
var newPalette = cmap.palette();
var newPixels = myPixels.map(function(p) { 
    return cmap.map(p); 
});
 
 */

// private constants

const sigbits = 5;
const rshift = 8 - sigbits;
const maxIterations = 1000;
const fractByPopulations = 0.75;

// get reduced-space color index for a pixel

const getColorIndex = (r: number, g: number, b: number): number => {
  return (r << (2 * sigbits)) + (g << sigbits) + b;
};

// Simple priority queue

interface CompareFunc<T> {
  (a: T, b: T): number;
}
interface MapFunc<T, U> {
  (value: T, index: number, array: T[]): U;
}

class PQueue<E> {
  private contents: Array<E>;
  private sorted: boolean;

  constructor(private comparator: CompareFunc<E>) {
    this.contents = [];
    this.sorted = false;
  }

  private sort(): void {
    this.contents.sort(this.comparator);
    this.sorted = true;
  }

  push(o: E): void {
    this.contents.push(o);
    this.sorted = false;
  }

  peek(index: number = this.contents.length - 1): E {
    if (!this.sorted) {
      this.sort();
    }
    return this.contents[index];
  }

  pop(): E {
    if (!this.sorted) {
      this.sort();
    }
    return this.contents.pop();
  }

  size(): number {
    return this.contents.length;
  }

  map(f: MapFunc<E, any>): Array<any> {
    return this.contents.map(f);
  }

  debug(): Array<E> {
    if (!this.sorted) {
      this.sort();
    }
    return this.contents;
  }
}

// 3d color space box

type Histo = number;

class VBox {
  _volume: number;
  _count_set: boolean;
  _count: number;
  _avg: number[];

  constructor(
    private r1: number,
    private r2: number,
    private g1: number,
    private g2: number,
    private b1: number,
    private b2: number,
    private histo: Histo
  ) {}

  volume(force): number {
    if (!this._volume || force) {
      this._volume =
        (this.r2 - this.r1 + 1) *
        (this.g2 - this.g1 + 1) *
        (this.b2 - this.b1 + 1);
    }

    return this._volume;
  }

  count(force) {
    if (!this._count_set || force) {
      let npix = 0;

      for (let i = this.r1; i <= this.r2; i++) {
        for (let j = this.g1; j <= this.g2; j++) {
          for (let k = this.b1; k <= this.b2; k++) {
            const index = getColorIndex(i, j, k);
            npix += this.histo[index] || 0;
          }
        }
      }

      this._count = npix;
      this._count_set = true;
    }

    return this._count;
  }

  copy() {
    return new VBox(
      this.r1,
      this.r2,
      this.g1,
      this.g2,
      this.b1,
      this.b2,
      this.histo
    );
  }

  avg(force) {
    if (!this._avg || force) {
      let ntot = 0;
      let mult = 1 << (8 - sigbits);
      let rsum = 0;
      let gsum = 0;
      let bsum = 0;

      for (let i = this.r1; i <= this.r2; i++) {
        for (let j = this.g1; j <= this.g2; j++) {
          for (let k = this.b1; k <= this.b2; k++) {
            const histoindex = getColorIndex(i, j, k);
            const hval = this.histo[histoindex] || 0;
            ntot += hval;
            rsum += hval * (i + 0.5) * mult;
            gsum += hval * (j + 0.5) * mult;
            bsum += hval * (k + 0.5) * mult;
          }
        }
      }

      if (ntot) {
        this._avg = [~~(rsum / ntot), ~~(gsum / ntot), ~~(bsum / ntot)];
      } else {
        //console.log('empty box');
        this._avg = [
          ~~((mult * (this.r1 + this.r2 + 1)) / 2),
          ~~((mult * (this.g1 + this.g2 + 1)) / 2),
          ~~((mult * (this.b1 + this.b2 + 1)) / 2)
        ];
      }
    }

    return this._avg;
  }

  contains(pixel: Color) {
    const rval = pixel[0] >> rshift;
    const gval = pixel[1] >> rshift;
    const bval = pixel[2] >> rshift;

    return (
      rval >= this.r1 &&
      rval <= this.r2 &&
      gval >= this.g1 &&
      gval <= this.g2 &&
      bval >= this.b1 &&
      bval <= this.b2
    );
  }
}

var MMCQ = (function() {
  // Color map

  function CMap() {
    this.vboxes = new PQueue(function(a, b) {
      return pv.naturalOrder(
        a.vbox.count() * a.vbox.volume(),
        b.vbox.count() * b.vbox.volume()
      );
    });
  }
  CMap.prototype = {
    push: function(vbox) {
      this.vboxes.push({
        vbox: vbox,
        color: vbox.avg()
      });
    },
    palette: function() {
      return this.vboxes.map(function(vb) {
        return vb.color;
      });
    },
    size: function() {
      return this.vboxes.size();
    },
    map: function(color) {
      var vboxes = this.vboxes;
      for (var i = 0; i < vboxes.size(); i++) {
        if (vboxes.peek(i).vbox.contains(color)) {
          return vboxes.peek(i).color;
        }
      }
      return this.nearest(color);
    },
    nearest: function(color) {
      var vboxes = this.vboxes,
        d1,
        d2,
        pColor;
      for (var i = 0; i < vboxes.size(); i++) {
        d2 = Math.sqrt(
          Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
            Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
            Math.pow(color[2] - vboxes.peek(i).color[2], 2)
        );
        if (d2 < d1 || d1 === undefined) {
          d1 = d2;
          pColor = vboxes.peek(i).color;
        }
      }
      return pColor;
    },
    forcebw: function() {
      // XXX: won't  work yet
      var vboxes = this.vboxes;
      vboxes.sort(function(a, b) {
        return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));
      });

      // force darkest color to black if everything < 5
      var lowest = vboxes[0].color;
      if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
        vboxes[0].color = [0, 0, 0];

      // force lightest color to white if everything > 251
      var idx = vboxes.length - 1,
        highest = vboxes[idx].color;
      if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
        vboxes[idx].color = [255, 255, 255];
    }
  };

  // histo (1-d array, giving the number of pixels in
  // each quantized region of color space), or null on error

  function getHisto(pixels: Color[]) {
    var histosize = 1 << (3 * sigbits),
      histo = new Array(histosize),
      index,
      rval,
      gval,
      bval;
    pixels.forEach(function(pixel) {
      rval = pixel[0] >> rshift;
      gval = pixel[1] >> rshift;
      bval = pixel[2] >> rshift;
      index = getColorIndex(rval, gval, bval);
      histo[index] = (histo[index] || 0) + 1;
    });
    return histo;
  }

  function vboxFromPixels(pixels: Color[], histo) {
    var rmin = 1000000,
      rmax = 0,
      gmin = 1000000,
      gmax = 0,
      bmin = 1000000,
      bmax = 0,
      rval,
      gval,
      bval;
    // find min/max
    pixels.forEach(function(pixel) {
      rval = pixel[0] >> rshift;
      gval = pixel[1] >> rshift;
      bval = pixel[2] >> rshift;
      if (rval < rmin) rmin = rval;
      else if (rval > rmax) rmax = rval;
      if (gval < gmin) gmin = gval;
      else if (gval > gmax) gmax = gval;
      if (bval < bmin) bmin = bval;
      else if (bval > bmax) bmax = bval;
    });
    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
  }

  function medianCutApply(histo, vbox) {
    if (!vbox.count()) return;

    var rw = vbox.r2 - vbox.r1 + 1,
      gw = vbox.g2 - vbox.g1 + 1,
      bw = vbox.b2 - vbox.b1 + 1,
      maxw = pv.max([rw, gw, bw]);
    // only one pixel, no split
    if (vbox.count() == 1) {
      return [vbox.copy()];
    }
    /* Find the partial sum arrays along the selected axis. */
    var total = 0,
      partialsum = [],
      lookaheadsum = [],
      i,
      j,
      k,
      sum,
      index;
    if (maxw == rw) {
      for (i = vbox.r1; i <= vbox.r2; i++) {
        sum = 0;
        for (j = vbox.g1; j <= vbox.g2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(i, j, k);
            sum += histo[index] || 0;
          }
        }
        total += sum;
        partialsum[i] = total;
      }
    } else if (maxw == gw) {
      for (i = vbox.g1; i <= vbox.g2; i++) {
        sum = 0;
        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.b1; k <= vbox.b2; k++) {
            index = getColorIndex(j, i, k);
            sum += histo[index] || 0;
          }
        }
        total += sum;
        partialsum[i] = total;
      }
    } else {
      /* maxw == bw */
      for (i = vbox.b1; i <= vbox.b2; i++) {
        sum = 0;
        for (j = vbox.r1; j <= vbox.r2; j++) {
          for (k = vbox.g1; k <= vbox.g2; k++) {
            index = getColorIndex(j, k, i);
            sum += histo[index] || 0;
          }
        }
        total += sum;
        partialsum[i] = total;
      }
    }
    partialsum.forEach(function(d, i) {
      lookaheadsum[i] = total - d;
    });

    function doCut(color) {
      var dim1 = color + "1",
        dim2 = color + "2",
        left,
        right,
        vbox1,
        vbox2,
        d2,
        count2 = 0;
      for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
        if (partialsum[i] > total / 2) {
          vbox1 = vbox.copy();
          vbox2 = vbox.copy();
          left = i - vbox[dim1];
          right = vbox[dim2] - i;
          if (left <= right) d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
          else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
          // avoid 0-count boxes
          while (!partialsum[d2]) d2++;
          count2 = lookaheadsum[d2];
          while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];
          // set dimensions
          vbox1[dim2] = d2;
          vbox2[dim1] = vbox1[dim2] + 1;
          // console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
          return [vbox1, vbox2];
        }
      }
    }
    // determine the cut planes
    return maxw == rw ? doCut("r") : maxw == gw ? doCut("g") : doCut("b");
  }

  function quantize(pixels: Color[], maxcolors) {
    // short-circuit
    if (!pixels.length || maxcolors < 2 || maxcolors > 256) {
      // console.log('wrong number of maxcolors');
      return false;
    }

    // XXX: check color content and convert to grayscale if insufficient

    var histo = getHisto(pixels),
      histosize = 1 << (3 * sigbits);

    // check that we aren't below maxcolors already
    var nColors = 0;
    histo.forEach(function() {
      nColors++;
    });
    if (nColors <= maxcolors) {
      // XXX: generate the new colors from the histo and return
    }

    // get the beginning vbox from the colors
    var vbox = vboxFromPixels(pixels, histo),
      pq = new PQueue(function(a, b) {
        return pv.naturalOrder(a.count(), b.count());
      });
    pq.push(vbox);

    // inner function to do the iteration

    function iter(lh, target) {
      var ncolors = lh.size(),
        niters = 0,
        vbox;
      while (niters < maxIterations) {
        if (ncolors >= target) return;
        if (niters++ > maxIterations) {
          // console.log("infinite loop; perhaps too few pixels!");
          return;
        }
        vbox = lh.pop();
        if (!vbox.count()) {
          /* just put it back */
          lh.push(vbox);
          niters++;
          continue;
        }
        // do the cut
        var vboxes = medianCutApply(histo, vbox),
          vbox1 = vboxes[0],
          vbox2 = vboxes[1];

        if (!vbox1) {
          // console.log("vbox1 not defined; shouldn't happen!");
          return;
        }
        lh.push(vbox1);
        if (vbox2) {
          /* vbox2 can be null */
          lh.push(vbox2);
          ncolors++;
        }
      }
    }

    // first set of colors, sorted by population
    iter(pq, fractByPopulations * maxcolors);
    // console.log(pq.size(), pq.debug().length, pq.debug().slice());

    // Re-sort by the product of pixel occupancy times the size in color space.
    var pq2 = new PQueue(function(a, b) {
      return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
    });
    while (pq.size()) {
      pq2.push(pq.pop());
    }

    // next set - generate the median cuts using the (npix * vol) sorting.
    iter(pq2, maxcolors);

    // calculate the actual colors
    var cmap = new CMap();
    while (pq2.size()) {
      cmap.push(pq2.pop());
    }

    return cmap;
  }

  return {
    quantize: quantize
  };
})();

export default MMCQ.quantize;
