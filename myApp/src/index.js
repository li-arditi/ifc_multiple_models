import {
    AmbientLight,
    AxesHelper,
    DirectionalLight,
    GridHelper,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    Raycaster,
    Vector2,
    MeshLambertMaterial
  } from "three";
  import {
      OrbitControls
  } from "three/examples/jsm/controls/OrbitControls";

  import { IFCLoader } from "web-ifc-three/IFCLoader";

  window.onload = function(){
  //Creates the Three.js scene
  const scene = new Scene();

  //Object to store the size of the viewport
  const size = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  //Creates the camera (point of view of the user)
  const aspect = size.width / size.height;
  const camera = new PerspectiveCamera(75, aspect);
  camera.position.z = 15;
  camera.position.y = 13;
  camera.position.x = 8;

  //Creates the lights of the scene
  const lightColor = 0xffffff;

  const ambientLight = new AmbientLight(lightColor, 0.5);
  scene.add(ambientLight);

  const directionalLight = new DirectionalLight(lightColor, 1);
  directionalLight.position.set(0, 10, 0);
  directionalLight.target.position.set(-5, 0, 0);
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  //Sets up the renderer, fetching the canvas of the HTML
  const threeCanvas = document.getElementById("three-canvas");
  console.log(threeCanvas);
  const renderer = new WebGLRenderer({
      canvas: threeCanvas,
      alpha: true
  });

  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  //Creates grids and axes in the scene
  const grid = new GridHelper(50, 30);
  scene.add(grid);

  const axes = new AxesHelper();
  axes.material.depthTest = false;
  axes.renderOrder = 1;
  scene.add(axes);

  //Creates the orbit controls (to navigate the scene)
  const controls = new OrbitControls(camera, threeCanvas);
  controls.enableDamping = true;
  controls.target.set(-2, 0, 0);

  //Animation loop
  const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();


  // Sets up the IFC loading
  const ifcModels = [];
  const ifcLoader = new IFCLoader();

  const input = document.getElementById("file-input");
  input.addEventListener(
    "change",
    (changed) => {
      const file = changed.target.files[0];
      console.log(file);
      var ifcURL = URL.createObjectURL(file);
      console.log(ifcURL)
      ifcLoader.load(
            ifcURL,
            (ifcModel) => {
                ifcModels.push(ifcModel);
                scene.add(ifcModel)
            });
    },
    false
  );

  async function loadIFC(fileName) {
    //await ifcLoader.ifcManager.setWasmPath("../../");
    ifcLoader.load(fileName, (ifcModel) => {
        ifcModels.push(ifcModel);
        scene.add(ifcModel);
    });
}

loadIFC("../Steel_mockup.ifc");
loadIFC("../Steel_mockup2.ifc")

// == the code below also does not work == //
//   ifcLoader.load("../Steel_mockup.ifc", (ifcModel) => {
    
//     // ifcModel.material = new MeshLambertMaterial({
//     //     transparent: true,
//     //     opacity: 0.5,
//     //     color: 0x77aaff,
        
//     //     depthTest: true 
//     // });
//     ifcModels.push(ifcModel);
//     scene.add(ifcModel);
// });
// ifcLoader.load("../Steel_mockup2.ifc", (ifcModel) => {
//     // ifcModel.material = new MeshLambertMaterial({
//     //     transparent: true,
//     //     opacity: 0.7,
//     //     color: 0xFFC0CB,
        
//     //     depthTest: true 
//     // });
//     ifcModels.push(ifcModel);
//     scene.add(ifcModel);
// });

  const highlightMaterial = new MeshLambertMaterial( { color: 0xff00ff, depthTest: false, transparent: true, opacity: 0.3 } );

  const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const mouse = new Vector2();

function cast(event) {

    // Computes the position of the mouse on the screen
    const bounds = threeCanvas.getBoundingClientRect();
  
    const x1 = event.clientX - bounds.left;
    const x2 = bounds.right - bounds.left;
    mouse.x = (x1 / x2) * 2 - 1;
  
    const y1 = event.clientY - bounds.top;
    const y2 = bounds.bottom - bounds.top;
    mouse.y = -(y1 / y2) * 2 + 1;
  
    // Places it on the camera pointing to the mouse
    raycaster.setFromCamera(mouse, camera);
  
    // Casts a ray
    return raycaster.intersectObjects(ifcModels);
  }

  function pick(event) {
    const found = cast(event)[0];
    if (found) {
        const index = found.faceIndex;
        const geometry = found.object.geometry;
        const ifc = ifcLoader.ifcManager;
        const id = ifc.getExpressId(geometry, index);
        console.log(id);
    }
}

function selectObject(event) {
    console.log(event.button)
    if ( event.button != 0 ) return;
    const found = cast(event)[0];
    console.log(found)
    if (found) {
        const index = found.faceIndex;
        const geometry = found.object.geometry;
        const ifc = ifcLoader.ifcManager;
        const id = ifc.getExpressId(geometry, index);
    

        const modelID = found.object.modelID;
        console.log(modelID)
        ifcLoader.ifcManager.createSubset( { modelID, ids: [ id ], scene, removePrevious: true, material: highlightMaterial } );
        const props = ifcLoader.ifcManager.getItemProperties( modelID, id, true );
        //console.log( props );
        //const props = ifcLoader.ifcManager.getPropertySets( modelID, id, true );
        console.log( props );
        
        renderer.render( scene, camera );
    }
}
threeCanvas.onpointerdown = selectObject;

  }
  
  //Adjust the viewport to the size of the browser
  window.addEventListener("resize", () => {
    size.width = window.innerWidth;
    size.height = window.innerHeight;
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
    renderer.setSize(size.width, size.height);
  });

  