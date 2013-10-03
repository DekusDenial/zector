# Zector Javascript Micro Library

__Zector__ is a micro size Javascript library for CSS selector engine mixins with some utility methods for easy use
It was inspired by jQuery and Zepto. There are small parts of the library leveraging some known features from Underscore & Backbone.

## Usage

```javascript
Z('.parent > li.row'); // pass in query selector as string
// => [<li class="row">...</li>]

Z(document.body); // pass in an actual HTMLElement
// => [<body>...</body>]
```

* API syntax is very similar to jQuery
* Fast DOM querying prioritizing native DOM API
* Returns Array-like object and supports method chaining
* Lightweight, perfect for mobile platform (only 3.9KB after gzip)

## Features (ongoing)

1. Event Delegation
  * Support all bubbling events delegated to target elements based on selector
  * But capturing behaves the same as bubbling when used with event delegation
  
    ```html
    <ul>
        <li><a href="path/to/page/1">click me to go to page1</a></li>
        <li><a href="path/to/page/2">click me to go to page2</a></li>
        <li><a class="page3" href="path/to/page/3">click me to go to page3</a></li>
        <li><a href="path/to/page/4">click me to go to page4</a></li>
        <li><a href="path/to/page/5">click me to go to page5</a></li>
    </ul>
    ```
    
    ```javascript
    Z('ul').on('click', '.page3', function(e){
        console.log(this.href);
    });

    // When the anchor only with the class of "page3" is clicked,
    // its "href" property will be logged and default page direct is prevented
    ```

2. Animation with requestAnimationFrame API
  * Usage similar to jQuery's animation
  * Instead of using a Javascript timer, it uses requestAnimationFrame as its core timing API
  * Can animation both style property and element property such as "ScrollTop" & "scrollLeft"
  * Many easing functions to choose from:
      linear (default), 
      easeInQuad, easeOutQuad, easeInOutQuad, 
      easeInCubic, easeOutCubic, easeInOutCubic, 
      easeInQuart, easeOutQuart, easeInOutQuart, 
      easeInQuint, easeOutQuint, easeInOutQuint, 
      easeInSine, easeOutSine, easeInOutSine, 
      easeInExpo, easeOutExpo, easeInOutExpo, 
      easeInCirc, easeOutCirc, easeInOutCirc, 
      easeInElastic, easeOutElastic, easeInOutElastic, 
      easeInBack, easeOutBack, easeInOutBack, 
      easeInBounce, easeOutBounce, easeInOutBounce
  * Currently CSS3 Transformation is not supported and only accept style properties with numeric pixel value only, no "em" or "%"...

    ```javascript
    // To scroll the page down, you can use this syntax sugar
    Z(document.body).scrollYTo(1000, 200, [, easing function string] [, callback ]);
    // OR using .animate directly
    Z(document.body).animate('scrollTop', 1000, 200, [, easing function string] [, callback ]);

    // To animate the 'top' property
    Z('#modal_box').animate('top', -100, [, easing function string] [, callback ]);
    ```

3. More coming...

## Build your own Zector

1. First clone the repo
```
git clone git://github.com/DekusDenial/zector.git && cd zector
```

2. Install the [grunt-cli](http://gruntjs.com/getting-started#installing-the-cli)
```
npm install -g grunt-cli
```

3. Install the rest of the node packages
```
npm install
```

4. You should see the following tasks when you run `grunt -h`
```bash
vailable tasks
          concat  Concatenate files. *                                           
          uglify  Minify files with UglifyJS. *                                  
          watch  Run predefined tasks whenever watched files change.            
          connect  Start a connect web server. *                                  
          jasmine  Run jasmine specs headlessly through PhantomJS. *              
          jshint  Validate files with JSHint. *                                  
          clean  Clean files and folders. *                                     
          compress  Compress files. *                                              
          default  Alias for "dev" task.                                          
           dev  Alias for "connect", "concat", "watch:src" tasks.              
          build  Alias for "concat", "uglify" tasks.                            
          test  Alias for "jshint", "jasmine", "watch:test" tasks.   
```

5. Run `grunt build` to build `zector.js` and `zector.min.js` to the `dist` directory. OR, run `grunt build compress` to build, in addition to the two files, also a gzipped of `zector.min.js`, called `zector.min.js.gz`