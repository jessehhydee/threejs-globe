# threejs-globe

This is inspired by Github & Stripes webgl globes.

The dots clustered togeather resembling continents are achieved by reading an image of the world.
Getting the image data for each pixel and iterating over each pixel.
If the pixels r,g,b values exceeed 100, display dot.
The position of the dot is worked out by determining the lat and long position of the pixel.

Each dot within the canvas independently changes colour to give off a twinkling effect.
This is achieved by shaders. 

If the globe is clicked and dragged, the globe rotates in the direction of the drag.
Along with this functionality, each dot independently extrudes off the globe creating a scattered effect.
This is achieved by shaders.

![alt text](https://github.com/jessehhydee/threejs-globe/blob/main/img/globe_screen_shot.jpg?raw=true)

