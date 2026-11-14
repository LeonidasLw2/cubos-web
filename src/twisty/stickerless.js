import { BufferAttribute, DoubleSide, ExtrudeGeometry, MeshBasicMaterial, Shape } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const radius = 0.16;
const bodyMaterial = new MeshBasicMaterial({ color: '#151920' });
let roundedCubie;
let roundedFace;

function roundCube3D(puzzle) {
  if (!roundedFace) {
    const edge = 0.486;
    const inset = edge - radius;
    const shape = new Shape();
    shape.moveTo(-inset, -edge);
    shape.lineTo(inset, -edge);
    shape.quadraticCurveTo(edge, -edge, edge, -inset);
    shape.lineTo(edge, inset);
    shape.quadraticCurveTo(edge, edge, inset, edge);
    shape.lineTo(-inset, edge);
    shape.quadraticCurveTo(-edge, edge, -edge, inset);
    shape.lineTo(-edge, -inset);
    shape.quadraticCurveTo(-edge, -edge, -inset, -edge);
    roundedFace = new ExtrudeGeometry(shape, {
      depth: 0.008, bevelSize: 0.014, bevelThickness: 0.009, bevelSegments: 2, curveSegments: 5,
    }).translate(0, 0, -0.011);
    roundedCubie = new RoundedBoxGeometry(0.984, 0.984, 0.984, 2, 0.11);
  }
  for (const mesh of puzzle.experimentalFoundationMeshes) {
    mesh.geometry = roundedCubie;
    mesh.material = bodyMaterial;
  }
  for (const orbit of Object.values(puzzle.kpuzzleFaceletInfo)) {
    for (const piece of orbit) {
      for (const { facelet } of piece) facelet.geometry = roundedFace;
    }
  }
}

function roundPG3D(puzzle) {
  const { fixedGeo, stickers, stickerMaterial } = puzzle;
  const facelets = Object.values(stickers).flat(2).filter(Boolean);
  // PG3D dibuja cada cara cuadrada con dos triángulos que conserva al girar la capa.
  if (!facelets.length || facelets.some((s) => s.stickerEnd - s.stickerStart !== 2
    || s.foundationEnd - s.foundationStart !== 2)) return;
  const coords = new Float32Array(fixedGeo.getAttribute('position').count * 2);
  const quad = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1];
  for (const { stickerStart, foundationStart } of facelets) {
    coords.set(quad, stickerStart * 6);
    coords.set(quad, foundationStart * 6);
  }
  fixedGeo.setAttribute('faceletCoord', new BufferAttribute(coords, 2));

  const plastic = stickerMaterial.clone();
  const foundation = new MeshBasicMaterial({ color: bodyMaterial.color, side: DoubleSide });
  plastic.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec2 faceletCoord;
      varying vec2 vFaceletCoord;
      ${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFaceletCoord = faceletCoord;');
    shader.fragmentShader = `varying vec2 vFaceletCoord;
      ${shader.fragmentShader}`.replace('#include <color_fragment>', `
        #include <color_fragment>
        vec2 corner = max(abs(vFaceletCoord) - ${1 - radius * 2}, 0.0);
        float dist = length(corner);
        if (dist > ${radius * 2}) discard;
        diffuseColor.rgb *= 1.0 - 0.17 * smoothstep(0.24, ${radius * 2}, dist);
      `);
  };
  foundation.onBeforeCompile = plastic.onBeforeCompile;
  const updateMaterialArrays = puzzle.updateMaterialArrays.bind(puzzle);
  puzzle.updateMaterialArrays = () => {
    updateMaterialArrays();
    if (!puzzle.textured) {
      puzzle.materialArray1[0] = plastic;
      puzzle.materialArray2[1] = plastic;
    }
    if (puzzle.showFoundations) {
      puzzle.materialArray1[6] = foundation;
      puzzle.materialArray2[7] = foundation;
    }
  };
  puzzle.updateMaterialArrays();
  return () => {
    plastic.dispose();
    foundation.dispose();
  };
}

export function applyStickerlessFinish(puzzle) {
  // shortcut: usa la estructura de cubing.js 0.66, revisar ambos renderizadores al actualizarlo.
  if (puzzle.kpuzzleFaceletInfo && puzzle.experimentalFoundationMeshes) {
    roundCube3D(puzzle);
  } else if (puzzle.fixedGeo && puzzle.stickers && puzzle.stickerMaterial?.vertexColors && puzzle.updateMaterialArrays) {
    return roundPG3D(puzzle);
  }
}
