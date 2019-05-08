#pragma once

#include "unicorn_hat_hd.h"

#define DATA_FORMAT_VERSION 1

typedef struct {
    const uint8_t   *pBitmapData;
    const uint16_t  *pBitmapTable;
    const uint16_t  *pPalette;
    const uint16_t  *pScenario;
} SEQUENCE_T;

class BufferController
{
public:
    BufferController(const SEQUENCE_T *pSequence);
    void        nextSequence(void);
    uint16_t    forwardSequence(void);
    uint16_t    *getBuffer(void);
    uint8_t     getBrightness(void);
    bool        isLooped(void);

private:
    void        setCurrentSequence(uint8_t index);
    void        drawBitmap(uint16_t attr, const uint8_t *bitmap, const uint16_t *palette);
    void        setPixel(int8_t x, int8_t y, uint16_t color);
    void        handleCommand(uint16_t cmd);
    void        clearFrameBuffer(uint16_t color);
    void        setBgcolor(uint16_t color);
    void        setBrightness(uint8_t b);

    const SEQUENCE_T *const pFirstSequence;
    SEQUENCE_T  currentSequence;
    uint8_t     sequenceIndex;
    const uint16_t *pCurrentScene;
    uint16_t    frameBuffer[LED_WIDTH * LED_HEIGHT];
    uint16_t    bgcolor = 0x0000; // BLACK
    uint8_t     brightness;
    bool        looped;
};
