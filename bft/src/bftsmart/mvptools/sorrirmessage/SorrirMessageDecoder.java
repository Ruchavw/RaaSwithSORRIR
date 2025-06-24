package bftsmart.mvptools.sorrirmessage;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.DataInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class SorrirMessageDecoder extends ByteToMessageDecoder {

    private Logger logger = LoggerFactory.getLogger(this.getClass());

    public SorrirMessageDecoder() {
    }

    @Override
    protected void decode(ChannelHandlerContext context, ByteBuf buffer, List<Object> list) throws Exception {

        //System.out.println("Decode: " + buffer);

        // Wait until the length prefix is available.
        if (buffer.readableBytes() < Integer.BYTES) {
            // System.out.println("buffer.readableBytes() < >Integer.BYTES");
            return;
        }

        int dataLength = buffer.getInt(buffer.readerIndex());

        // Wait until the whole data is available.
        if (buffer.readableBytes() < dataLength + Integer.BYTES) {
            // System.out.println("message length " + dataLength);
            // System.out.println("buffer.readableBytes(): " + buffer.readableBytes() + "< dataLength + Integer.BYTES : " + dataLength + Integer.BYTES);
            return;
        }

        // Skip the length field because we know it already.
        buffer.skipBytes(Integer.BYTES);

        int size = buffer.readInt();
        //System.out.println("Size of String to be decoded : " + size);
        byte[] data = new byte[size];
        buffer.readBytes(data);

        DataInputStream dis = null;
        String message = null;

        try {
            message = new String(data, StandardCharsets.UTF_8);

            //logger.debug("Decoded message: " + message);
            // System.out.println("Decoded: " + message);
            list.add(message);
        } catch (Exception ex) {

            logger.error("Failed to decode Sorrir Message", ex);
        }
        return;
    }

}
