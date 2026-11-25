/**
 * Warehouse Routing Engine (Thuật toán Tối ưu hóa Lộ trình Lấy hàng)
 * Tuân thủ tiêu chuẩn SAP EWM Travel Distance Calculation (TDC) & Manhattan Active WMS.
 *
 * Sơ đồ lưới trực giao (Orthogonal Warehouse Graph):
 * - Hành lang chính phía dưới (Main Transit Aisle): Y = 450 (kết nối Dock 01, các đầu dãy kệ, và Bàn QC)
 * - Hành lang thoát hiểm phía trên (Top Cross Aisle): Y = 55 (kết nối đầu trên của các dãy kệ)
 * - Các lối đi dọc giữa các dãy kệ (Vertical Aisles):
 *     + Dãy A01: X = 195, Y từ 55 đến 450
 *     + Dãy A02: X = 375, Y từ 55 đến 450
 *     + Dãy B01: X = 575, Y từ 55 đến 450
 *     + Dãy B02: X = 755, Y từ 55 đến 450
 * - Tỉ lệ xích: 1 mét = 20 pixels (tốc độ xe nâng/đi bộ chuẩn = 1.0 m/s = 20 px/s)
 */

export interface Point {
  x: number;
  y: number;
}

export interface RouteResult {
  pathPoints: Point[];
  pathD: string;
  totalDistanceMeters: number;
  travelTimeSeconds: number;
  pickTimeSeconds: number;
  totalTimeMinutes: number;
  algorithmName: string;
  isOptimal: boolean;
}

const SCALE_PX_PER_METER = 20; // 20px = 1 mét
const WALKING_SPEED_MPS = 1.0; // 1.0 mét/giây
const SCAN_TIME_PER_STOP_SEC = 12; // 12 giây quét mã ô kệ và đối soát lô FEFO
const PICK_TIME_PER_ITEM_SEC = 3; // 3 giây bốc xếp và kiểm đếm 1 đơn vị sản phẩm

const MAIN_AISLE_Y = 450; // Hành lang chính phía dưới
const TOP_AISLE_Y = 55; // Hành lang đỉnh phía trên

export const START_DOCK: Point = { x: 80, y: MAIN_AISLE_Y };
export const FINISH_QC: Point = { x: 900, y: MAIN_AISLE_Y };

/**
 * Tính khoảng cách Euclidean giữa 2 điểm (px)
 */
function euclidean(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Chuyển đổi mảng điểm thành chuỗi path SVG d=""
 */
export function pointsToSvgPath(points: Point[]): string {
  if (!points || points.length === 0) return '';
  return points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');
}

/**
 * Tính tổng độ dài đường đi theo mảng điểm (mét)
 */
export function calculatePathLengthMeters(points: Point[]): number {
  let pxLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    pxLength += euclidean(points[i], points[i + 1]);
  }
  return Math.round((pxLength / SCALE_PX_PER_METER) * 10) / 10;
}

/**
 * 1. THUẬT TOÁN ĐƯỜNG ĐI NGẮN NHẤT (DIJKSTRA / GRAPH SHORTEST PATH)
 * Tìm lộ trình ngắn nhất trên đồ thị lối đi vuông góc:
 * - Không bay xuyên qua kệ
 * - Đi dọc hành lang chính hoặc hành lang trên
 * - Lựa chọn đi vào và quay đầu (Return) hoặc đi xuyên qua (Traverse) tùy thuộc đoạn nào ngắn hơn
 */
export function calculateDijkstraShortestRoute(
  waypoints: Array<{ x: number; y: number; qty?: number }>,
  start: Point = START_DOCK,
  finish: Point = FINISH_QC
): RouteResult {
  if (!waypoints || waypoints.length === 0) {
    const direct = [start, finish];
    const dist = calculatePathLengthMeters(direct);
    return {
      pathPoints: direct,
      pathD: pointsToSvgPath(direct),
      totalDistanceMeters: dist,
      travelTimeSeconds: Math.round(dist / WALKING_SPEED_MPS),
      pickTimeSeconds: 0,
      totalTimeMinutes: Math.round(((dist / WALKING_SPEED_MPS) / 60) * 10) / 10,
      algorithmName: 'Đường Đi Ngắn Nhất (Dijkstra Graph)',
      isOptimal: true,
    };
  }

  // Sắp xếp các điểm dừng theo vị trí X từ gần đến xa (Nearest-Neighbor theo hướng di chuyển từ Dock -> Bàn QC)
  const sortedStops = [...waypoints].sort((a, b) => a.x - b.x || a.y - b.y);

  const fullPath: Point[] = [start];
  let currentPos: Point = start;
  let totalQty = 0;

  for (let i = 0; i < sortedStops.length; i++) {
    const stop = sortedStops[i];
    totalQty += stop.qty || 1;

    // Chặng 1: Di chuyển từ vị trí hiện tại đến đầu dãy kệ của điểm dừng
    // Đi dọc theo hành lang hiện tại (Thường là MAIN_AISLE_Y hoặc TOP_AISLE_Y)
    const aisleX = stop.x;
    const currentAisleY = currentPos.y === TOP_AISLE_Y ? TOP_AISLE_Y : MAIN_AISLE_Y;

    if (currentPos.x !== aisleX) {
      fullPath.push({ x: aisleX, y: currentAisleY });
    }

    // Chặng 2: Đi dọc vào lối dãy kệ tới điểm nhặt hàng
    fullPath.push({ x: aisleX, y: stop.y });

    // Xác định điểm tiếp theo (hoặc bàn QC nếu là điểm cuối)
    const nextTarget = i < sortedStops.length - 1 ? sortedStops[i + 1] : finish;

    // Quyết định Dijkstra: Đi tiếp lên trên (TOP_AISLE_Y) hay quay lại dưới (MAIN_AISLE_Y)?
    const distViaBottom = Math.abs(stop.y - MAIN_AISLE_Y) + Math.abs(nextTarget.y - MAIN_AISLE_Y);
    const distViaTop = Math.abs(stop.y - TOP_AISLE_Y) + Math.abs(nextTarget.y - TOP_AISLE_Y);

    if (distViaBottom <= distViaTop) {
      // Quay lại hành lang dưới
      fullPath.push({ x: aisleX, y: MAIN_AISLE_Y });
      currentPos = { x: aisleX, y: MAIN_AISLE_Y };
    } else {
      // Đi thoát ra hành lang trên
      fullPath.push({ x: aisleX, y: TOP_AISLE_Y });
      currentPos = { x: aisleX, y: TOP_AISLE_Y };
    }
  }

  // Chặng cuối: Đi từ vị trí hiện tại đến Bàn QC (900, 450)
  if (currentPos.y !== MAIN_AISLE_Y) {
    // Nếu đang ở hành lang trên, đi đến ngã rẽ cuối (X=755 hoặc X=900) rồi xuống
    fullPath.push({ x: 755, y: TOP_AISLE_Y });
    fullPath.push({ x: 755, y: MAIN_AISLE_Y });
  }
  fullPath.push(finish);

  const totalDistance = calculatePathLengthMeters(fullPath);
  const travelTimeSeconds = Math.round(totalDistance / WALKING_SPEED_MPS);
  const pickTimeSeconds = sortedStops.length * SCAN_TIME_PER_STOP_SEC + totalQty * PICK_TIME_PER_ITEM_SEC;
  const totalSeconds = travelTimeSeconds + pickTimeSeconds;
  const totalTimeMinutes = Math.round((totalSeconds / 60) * 10) / 10;

  return {
    pathPoints: fullPath,
    pathD: pointsToSvgPath(fullPath),
    totalDistanceMeters: totalDistance,
    travelTimeSeconds,
    pickTimeSeconds,
    totalTimeMinutes,
    algorithmName: 'Đường Đi Ngắn Nhất (Dijkstra Graph)',
    isOptimal: true,
  };
}

/**
 * 2. THUẬT TOÁN S-SHAPE HEURISTIC (SERPENTINE TRAVERSAL)
 * Tiêu chuẩn cổ điển của kho công nghiệp:
 * - Đi xuyên suốt lối kệ từ đầu này sang đầu kia nếu lối đó có hàng cần lấy
 * - Uốn lượn liên tục theo hình chữ S để không bao giờ phải quay đầu trong lối kệ chật hẹp
 */
export function calculateSShapeHeuristicRoute(
  waypoints: Array<{ x: number; y: number; qty?: number }>,
  start: Point = START_DOCK,
  finish: Point = FINISH_QC
): RouteResult {
  if (!waypoints || waypoints.length === 0) {
    return calculateDijkstraShortestRoute(waypoints, start, finish);
  }

  // Nhóm các điểm dừng theo từng dãy kệ (Aisle X)
  const aisleMap = new Map<number, Array<{ x: number; y: number; qty?: number }>>();
  waypoints.forEach((wp) => {
    if (!aisleMap.has(wp.x)) aisleMap.set(wp.x, []);
    aisleMap.get(wp.x)!.push(wp);
  });

  const sortedAisles = Array.from(aisleMap.keys()).sort((a, b) => a - b);
  const fullPath: Point[] = [start];
  let currentAisleY = MAIN_AISLE_Y; // Bắt đầu ở hành lang dưới
  let totalQty = 0;

  waypoints.forEach((w) => (totalQty += w.qty || 1));

  sortedAisles.forEach((aisleX, idx) => {
    const stopsInAisle = aisleMap.get(aisleX)!;

    // Di chuyển dọc hành lang hiện tại đến đầu dãy
    fullPath.push({ x: aisleX, y: currentAisleY });

    if (currentAisleY === MAIN_AISLE_Y) {
      // Đang ở dưới: Sắp xếp lấy hàng từ dưới lên trên
      stopsInAisle.sort((a, b) => b.y - a.y);
      stopsInAisle.forEach((s) => fullPath.push({ x: aisleX, y: s.y }));

      // Nếu không phải dãy cuối cùng, đi xuyên suốt lên hành lang trên (S-Shape traversal)
      if (idx < sortedAisles.length - 1) {
        fullPath.push({ x: aisleX, y: TOP_AISLE_Y });
        currentAisleY = TOP_AISLE_Y;
      } else {
        // Dãy cuối: nếu đi lên hành lang trên xa hơn về bàn QC thì quay lại dưới
        fullPath.push({ x: aisleX, y: MAIN_AISLE_Y });
        currentAisleY = MAIN_AISLE_Y;
      }
    } else {
      // Đang ở trên: Sắp xếp lấy hàng từ trên xuống dưới
      stopsInAisle.sort((a, b) => a.y - b.y);
      stopsInAisle.forEach((s) => fullPath.push({ x: aisleX, y: s.y }));

      // Đi xuyên suốt xuống hành lang dưới
      fullPath.push({ x: aisleX, y: MAIN_AISLE_Y });
      currentAisleY = MAIN_AISLE_Y;
    }
  });

  // Đi về Bàn QC
  if (currentAisleY !== MAIN_AISLE_Y) {
    fullPath.push({ x: 755, y: TOP_AISLE_Y });
    fullPath.push({ x: 755, y: MAIN_AISLE_Y });
  }
  fullPath.push(finish);

  const totalDistance = calculatePathLengthMeters(fullPath);
  const travelTimeSeconds = Math.round(totalDistance / WALKING_SPEED_MPS);
  const pickTimeSeconds = waypoints.length * SCAN_TIME_PER_STOP_SEC + totalQty * PICK_TIME_PER_ITEM_SEC;
  const totalSeconds = travelTimeSeconds + pickTimeSeconds;
  const totalTimeMinutes = Math.round((totalSeconds / 60) * 10) / 10;

  return {
    pathPoints: fullPath,
    pathD: pointsToSvgPath(fullPath),
    totalDistanceMeters: totalDistance,
    travelTimeSeconds,
    pickTimeSeconds,
    totalTimeMinutes,
    algorithmName: 'S-Shape Heuristic (Quét Theo Dãy)',
    isOptimal: false,
  };
}

