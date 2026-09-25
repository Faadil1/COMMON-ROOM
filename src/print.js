/* Print-at-home card: CR80 size (85.6 × 54 mm), front and back on one A4 sheet.
   Cut on the marks, fold on the dashed line, glue — the back is printed upside down so it lands upright. */
import { svgToCanvas } from './raster.js'
import { W, H } from './cardArt.jsx'

export async function printCard({ front, back, number, name }) {
  const [{ jsPDF }, f, b] = await Promise.all([
    import('jspdf'),
    svgToCanvas(front, { width: W, height: H, scale: 4, background: '#ffffff' }),
    svgToCanvas(back, { width: W, height: H, scale: 4, background: '#ffffff', rotate180: true }),
  ])
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const cw = 85.6
  const ch = 54
  const x = (210 - cw) / 2
  const y1 = 78
  const y2 = y1 + ch

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('COMMON ROOM  ·  NORTH QUARTER PUBLIC LIBRARY', 105, 28, { align: 'center' })
  pdf.setFont('times', 'italic')
  pdf.setFontSize(15)
  pdf.text(name ? `${name}'s member card  ·  ${number}` : `Member card  ·  ${number}`, 105, 38, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.setTextColor(90)
  ;[
    '1. Print at 100 % (actual size, no scaling), on thick paper if you have it.',
    '2. Cut along the corner marks.   3. Fold on the dashed line.   4. Glue the two halves together.',
  ].forEach((line, i) => pdf.text(line, 105, 50 + i * 5, { align: 'center' }))

  pdf.addImage(f.toDataURL('image/jpeg', 0.93), 'JPEG', x, y1, cw, ch, undefined, 'FAST')
  pdf.addImage(b.toDataURL('image/jpeg', 0.93), 'JPEG', x, y2, cw, ch, undefined, 'FAST')

  pdf.setDrawColor(40)
  pdf.setLineWidth(0.2)
  const mark = (px, py, sx, sy) => {
    pdf.line(px + sx * 2, py, px + sx * 8, py)
    pdf.line(px, py + sy * 2, px, py + sy * 8)
  }
  mark(x, y1, -1, -1)
  mark(x + cw, y1, 1, -1)
  mark(x, y2 + ch, -1, 1)
  mark(x + cw, y2 + ch, 1, 1)
  pdf.setLineDashPattern([1.4, 1.4], 0)
  pdf.line(x - 10, y2, x - 2, y2)
  pdf.line(x + cw + 2, y2, x + cw + 10, y2)
  pdf.setLineDashPattern([], 0)
  pdf.setFontSize(6.5)
  pdf.text('FOLD', x - 12, y2 + 1, { align: 'right' })

  pdf.setFontSize(7.5)
  pdf.setTextColor(120)
  pdf.text('This card remembers. Every mark on it is something you actually did in the library.', 105, y2 + ch + 20, { align: 'center' })
  pdf.save(`common-room-${number.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
