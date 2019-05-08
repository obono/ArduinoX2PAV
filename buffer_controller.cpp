#include <arduino.h>

#include "buffer_controller.h"

#define CMD_MASK        0xc000
#define CMD_BRIGHTNESS  0xff00
#define CMD_BGCOLOR     0xfff0
#define CMD_TERMINATE   0xffff

#define INFO_BMP_SHIFT  10
#define INFO_PAL_MASK   0x3ff

#define BRIGHTNESS_DEFAULT  ((BRIGHTNESS_MAX) / 2)

#define ATTR_X_NEG  0x0010
#define ATTR_Y_NEG  0x0200
#define ATTR_ROT90  0x0400
#define ATTR_FLIPH  0x0800
#define ATTR_FLIPV  0x1000
#define ATTR_CLEAR  0x2000

BufferController::BufferController(const SEQUENCE_T *pSequence):
    pFirstSequence(pSequence),
    sequenceIndex(0)
{
    setCurrentSequence(0);
}

void BufferController::nextSequence(void)
{
    setCurrentSequence(++sequenceIndex);
    if (!currentSequence.pBitmapData) {
        sequenceIndex = 0;
        setCurrentSequence(0);
    }
}

uint16_t BufferController::forwardSequence(void)
{
    while (true) {
        uint16_t cmd = pgm_read_word(pCurrentScene++);
        switch (cmd & CMD_MASK) {
        case 0x0000:
            return cmd; // display duration
        case 0x4000:
        {
            uint16_t info = pgm_read_word(pCurrentScene++);
            const uint8_t  *pBitmap = currentSequence.pBitmapData +
                    pgm_read_word(currentSequence.pBitmapTable + (info >> INFO_BMP_SHIFT));
            const uint16_t *pPalette = currentSequence.pPalette + (info & INFO_PAL_MASK);
            drawBitmap(cmd, pBitmap, pPalette);
            break;
        }
        case 0x8000:
        case 0xc000:
        default:
            handleCommand(cmd);
            break;
        }
    }
}

uint16_t *BufferController::getBuffer(void)
{
    return frameBuffer;
}

uint8_t BufferController::getBrightness(void)
{
    return brightness;
}

bool BufferController::isLooped(void)
{
    return looped;
}

/*---------------------------------------------------------------------------*/

void BufferController::setCurrentSequence(uint8_t index)
{
    memcpy_P(&currentSequence, pFirstSequence + index, sizeof(SEQUENCE_T));
    brightness = BRIGHTNESS_DEFAULT;
    pCurrentScene = currentSequence.pScenario;
    looped = false;
}

void BufferController::drawBitmap(uint16_t attr, const uint8_t *bitmap, const uint16_t *palette)
{
    uint8_t tmp = pgm_read_byte(bitmap++);
    uint8_t bitPerColor = (tmp & 0x7) + 1;
    bool isTrans = tmp & 0x8;

    tmp = pgm_read_byte(bitmap++);
    uint8_t width =  (tmp      & 0xf) + 1;
    uint8_t height = (tmp >> 4 & 0xf) + 1;

    if (attr & ATTR_CLEAR) {
        clearFrameBuffer(bgcolor);
    }

    int8_t x = (attr      & 0xf) - ((attr & ATTR_X_NEG) ? 16 : 0);
    int8_t y = (attr >> 5 & 0xf) - ((attr & ATTR_Y_NEG) ? 16 : 0);
    if (x + width < 0 || x >= LED_WIDTH || y + height < 0 || y >= LED_HEIGHT) {
        return;
    }

    uint16_t bitData = 0;
    uint8_t bitShift = 0;
    uint8_t bitMask = (1 << bitPerColor) - 1;
    for (uint8_t i = 0; i < height; i++) {
        for (uint8_t j = 0; j < width; j++) {
            if (bitShift < bitPerColor) {
                bitData = bitData << 8 | pgm_read_byte(bitmap++);
                bitShift += 8;
            }
            bitShift -= bitPerColor;
            uint8_t colorIndex = bitData >> bitShift & bitMask;
            if (isTrans && colorIndex == bitMask) {
                continue; // transparent
            }
            int8_t cx = (attr & ATTR_FLIPH) ? width - j - 1 : j;
            int8_t cy = (attr & ATTR_FLIPV) ? height - i - 1 : i;
            if (attr & ATTR_ROT90) {
                int8_t tmp = cx;
                cx = height - cy - 1;
                cy = tmp;
            }
            uint16_t color = (uint16_t) pgm_read_word(palette + colorIndex);
            setPixel(x + cx, y + cy, color);
        }
    }
}

void BufferController::setPixel(int8_t x, int8_t y, uint16_t color)
{
    if (x >= 0 && x < LED_WIDTH && y >= 0 && y < LED_HEIGHT) {
        frameBuffer[y * LED_WIDTH + x] = color;
    }
}

void BufferController::handleCommand(uint16_t cmd)
{
    switch (cmd) {
    case CMD_BGCOLOR:
        setBgcolor(pgm_read_word(pCurrentScene++));
        break;
    case CMD_TERMINATE:
        pCurrentScene = currentSequence.pScenario;
        looped = true;
        break;
    default:
        if (cmd >= CMD_BRIGHTNESS && cmd <= CMD_BRIGHTNESS + BRIGHTNESS_MAX) {
            setBrightness(cmd - CMD_BRIGHTNESS);
        }
        break;
    }
}

void BufferController::clearFrameBuffer(uint16_t color)
{
    for (uint16_t *p = frameBuffer; p < frameBuffer + LED_WIDTH * LED_HEIGHT; *p++ = color) {
        ;
    }
}

void BufferController::setBgcolor(uint16_t color)
{
    bgcolor = color;
}

void BufferController::setBrightness(uint8_t value)
{
    brightness = min(value, BRIGHTNESS_MAX);
}
