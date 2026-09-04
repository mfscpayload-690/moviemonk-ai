import 'package:flutter/material.dart';

/// Official 4-color Google "G" logo vector widget.
class GoogleLogo extends StatelessWidget {
  final double size;
  const GoogleLogo({super.key, this.size = 22});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _GoogleLogoPainter(),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double scale = size.width / 24.0;
    canvas.scale(scale, scale);

    final Paint red = Paint()..color = const Color(0xFFEA4335);
    final Paint yellow = Paint()..color = const Color(0xFFFBBC05);
    final Paint green = Paint()..color = const Color(0xFF34A853);
    final Paint blue = Paint()..color = const Color(0xFF4285F4);

    // Red Path (Top arc)
    final pathRed = Path()
      ..moveTo(12.0, 5.0)
      ..cubicTo(14.8, 5.0, 17.1, 6.0, 18.7, 7.5)
      ..lineTo(22.1, 4.1)
      ..cubicTo(19.5, 1.6, 16.0, 0.0, 12.0, 0.0)
      ..cubicTo(7.3, 0.0, 3.3, 2.7, 1.3, 6.6)
      ..lineTo(5.2, 9.6)
      ..cubicTo(6.1, 6.9, 8.8, 5.0, 12.0, 5.0)
      ..close();
    canvas.drawPath(pathRed, red);

    // Blue Path (Right & Center bar)
    final pathBlue = Path()
      ..moveTo(23.5, 12.3)
      ..cubicTo(23.5, 11.5, 23.4, 10.7, 23.3, 10.0)
      ..lineTo(12.0, 10.0)
      ..lineTo(12.0, 14.5)
      ..lineTo(18.5, 14.5)
      ..cubicTo(18.2, 16.1, 17.3, 17.5, 15.8, 18.5)
      ..lineTo(19.6, 21.5)
      ..cubicTo(22.0, 19.3, 23.5, 16.1, 23.5, 12.3)
      ..close();
    canvas.drawPath(pathBlue, blue);

    // Yellow Path (Left arc)
    final pathYellow = Path()
      ..moveTo(5.2, 14.4)
      ..cubicTo(4.7, 13.0, 4.7, 11.0, 5.2, 9.6)
      ..lineTo(1.3, 6.6)
      ..cubicTo(0.5, 8.3, 0.0, 10.1, 0.0, 12.0)
      ..cubicTo(0.0, 13.9, 0.5, 15.7, 1.3, 17.4)
      ..lineTo(5.2, 14.4)
      ..close();
    canvas.drawPath(pathYellow, yellow);

    // Green Path (Bottom arc)
    final pathGreen = Path()
      ..moveTo(12.0, 24.0)
      ..cubicTo(15.9, 24.0, 19.3, 22.7, 21.6, 20.6)
      ..lineTo(17.8, 17.6)
      ..cubicTo(16.4, 18.6, 14.4, 19.2, 12.0, 19.2)
      ..cubicTo(8.8, 19.2, 6.1, 17.3, 5.2, 14.6)
      ..lineTo(1.3, 17.6)
      ..cubicTo(3.3, 21.4, 7.3, 24.0, 12.0, 24.0)
      ..close();
    canvas.drawPath(pathGreen, green);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Official GitHub Octocat vector icon widget.
class GithubLogo extends StatelessWidget {
  final double size;
  final Color color;

  const GithubLogo({super.key, this.size = 22, this.color = Colors.white});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _GithubLogoPainter(color: color),
      ),
    );
  }
}

class _GithubLogoPainter extends CustomPainter {
  final Color color;
  _GithubLogoPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final double scale = size.width / 24.0;
    canvas.scale(scale, scale);

    final Paint paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(12.0, 0.0)
      ..cubicTo(5.37, 0.0, 0.0, 5.37, 0.0, 12.0)
      ..cubicTo(0.0, 17.31, 3.44, 21.8, 8.21, 23.39)
      ..cubicTo(8.81, 23.5, 9.03, 23.13, 9.03, 22.81)
      ..cubicTo(9.03, 22.53, 9.02, 21.78, 9.01, 20.78)
      ..cubicTo(5.67, 21.5, 4.97, 19.17, 4.97, 19.17)
      ..cubicTo(4.43, 17.78, 3.64, 17.41, 3.64, 17.41)
      ..cubicTo(2.55, 16.66, 3.72, 16.68, 3.72, 16.68)
      ..cubicTo(4.93, 16.76, 5.57, 17.92, 5.57, 17.92)
      ..cubicTo(6.64, 19.76, 8.38, 19.23, 9.07, 18.92)
      ..cubicTo(9.18, 18.14, 9.49, 17.61, 9.83, 17.31)
      ..cubicTo(7.17, 17.01, 4.37, 15.98, 4.37, 11.39)
      ..cubicTo(4.37, 10.08, 4.84, 9.01, 5.61, 8.17)
      ..cubicTo(5.48, 7.87, 5.07, 6.65, 5.73, 5.0)
      ..cubicTo(5.73, 5.0, 6.74, 4.68, 9.03, 6.23)
      ..cubicTo(9.99, 5.96, 11.02, 5.83, 12.0, 5.82)
      ..cubicTo(12.98, 5.83, 14.01, 5.96, 14.97, 6.23)
      ..cubicTo(17.26, 4.68, 18.26, 5.0, 18.26, 5.0)
      ..cubicTo(18.93, 6.65, 18.52, 7.87, 18.39, 8.17)
      ..cubicTo(19.17, 9.01, 19.63, 10.08, 19.63, 11.39)
      ..cubicTo(19.63, 15.99, 16.83, 17.0, 14.16, 17.3)
      ..cubicTo(14.59, 17.67, 14.97, 18.4, 14.97, 19.52)
      ..cubicTo(14.97, 21.12, 14.96, 22.41, 14.96, 22.81)
      ..cubicTo(14.96, 23.13, 15.18, 23.51, 15.79, 23.39)
      ..cubicTo(20.56, 21.8, 24.0, 17.31, 24.0, 12.0)
      ..cubicTo(24.0, 5.37, 18.63, 0.0, 12.0, 0.0)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _GithubLogoPainter oldDelegate) =>
      oldDelegate.color != color;
}
