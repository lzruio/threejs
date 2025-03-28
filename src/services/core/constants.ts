import type { ColorRepresentation, Texture } from 'three'

// 线宽
const wireframeLineWidth = 1
// 高亮颜色
const HoleFillColor_highLight = 0xff0000

const PlankFillColor_highLight = 0xc3a171

// 测试色
// const GrooveFillColor_transparent = 0x4952f4
// const GrooveEdgeColor_transparent = 0x4952f4

// const HoleFillColor_transparent = 0x4952f4
// const HoleEdgeColor_transparent = 0x4952f4

// const PlankFillColor_transparent = 0xffffff
// const PlankEdgeColor_transparent = 0x6c6465

// 透视
const GrooveFillColor_transparent = 0x929afa
const GrooveEdgeColor_transparent = 0x929afa

const HoleFillColor_transparent = 0x929afa
const HoleEdgeColor_transparent = 0x929afa

const PlankFillColor_transparent = 0xffffff
const PlankEdgeColor_transparent = 0x958d8e
const COLOR_PLANK_EDGE_TRANSPARENT = 0x958d8e
// 0x807677
// 线框
const GrooveFillColor_wireframe = 0x929afa
const GrooveEdgeColor_wireframe = 0x929afa

const HoleFillColor_wireframe = 0x929afa
const HoleEdgeColor_wireframe = 0x929afa

const PlankFillColor_wireframe = 0xffffff
const PlankEdgeColor_wireframe = 0x000001

// 材质线框
const GrooveFillColor_materialAndWireframe = 0xff0000
const GrooveEdgeColor_materialAndWireframe = 0x929afa

const HoleFillColor_materialAndWireframe = 0xff0000
const HoleEdgeColor_materialAndWireframe = 0x929afa

const PlankFillColor_materialAndWireframe = 0xffffff
const PlankEdgeColor_materialAndWireframe = 0x807677

// 材质的配置
export interface MaterialConfig {
  color?: ColorRepresentation
  opacity?: number
  map?: Texture | null
  lineWidth?: number
}

export interface ViewConfig {
  [key: string]: MaterialConfig
}

// 透明视图下的颜色
export const TransparentView: ViewConfig = {
  // 板
  board: {
    opacity: 0,
    map: null,
    color: PlankFillColor_transparent,
  },
  boardEdge: {
    color: PlankEdgeColor_transparent,
    lineWidth: wireframeLineWidth,
  },
  // 槽
  groove: {
    opacity: 0,
    color: GrooveFillColor_transparent,
  },
  grooveEdge: {
    color: GrooveEdgeColor_transparent,
    lineWidth: wireframeLineWidth,
  },
  // 孔
  hole: {
    opacity: 0,
    color: HoleFillColor_transparent,
  },
  holeEdge: {
    color: HoleEdgeColor_transparent,
    lineWidth: wireframeLineWidth,
  },
}

// 线框视图下的颜色
export const WireframeView: ViewConfig = {
  // 板
  board: {
    opacity: 1,
    color: PlankFillColor_wireframe,
    map: null,
  },
  boardEdge: {
    color: PlankEdgeColor_wireframe,
    lineWidth: wireframeLineWidth,
  },
  // 槽
  groove: {
    opacity: 1,
    color: GrooveFillColor_wireframe,
  },
  grooveEdge: {
    color: GrooveEdgeColor_wireframe,
    lineWidth: wireframeLineWidth,
  },
  // 孔
  hole: {
    opacity: 1,
    color: HoleFillColor_wireframe,
  },
  holeEdge: {
    color: HoleEdgeColor_wireframe,
    lineWidth: wireframeLineWidth,
  },
}

// 材质+线框视图下的颜色
export const MaterialAndWireframeView: ViewConfig = {
  board: {
    opacity: 1,
    color: PlankFillColor_materialAndWireframe,
  },
  boardEdge: {
    color: PlankEdgeColor_materialAndWireframe,
    lineWidth: wireframeLineWidth,
  },
  groove: {
    opacity: 1,
    color: GrooveFillColor_materialAndWireframe,
  },
  grooveEdge: {
    color: GrooveEdgeColor_materialAndWireframe,
    lineWidth: wireframeLineWidth,
  },
  hole: {
    opacity: 1,
    color: HoleFillColor_materialAndWireframe,
  },
  holeEdge: {
    color: GrooveEdgeColor_materialAndWireframe,
    lineWidth: wireframeLineWidth,
  },
}
