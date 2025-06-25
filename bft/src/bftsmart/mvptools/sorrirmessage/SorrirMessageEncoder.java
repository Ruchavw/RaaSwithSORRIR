package bftsmart.mvptools.sorrirmessage;


import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.MessageToByteEncoder;


public class SorrirMessageEncoder extends MessageToByteEncoder<String> {


    public  SorrirMessageEncoder() {}

    @Override
    protected void encode(ChannelHandlerContext context, String message, ByteBuf buffer) throws Exception {

        // System.out.println("Encode " + message + "" + message.length());

        byte[] msgData = message.getBytes();
        int dataLength = Integer.BYTES + msgData.length;

        /* msg size */
        buffer.writeInt(dataLength);

        /* data to be sent */
        buffer.writeInt(msgData.length);
        buffer.writeBytes(msgData);

        // System.out.println("Encoded " + buffer + buffer.readableBytes());

        context.flush();
    }

}
