package bftsmart.mvptools.frontend;

import bftsmart.communication.client.ReplyListener;
import bftsmart.tom.AsynchServiceProxy;
import bftsmart.tom.RequestContext;
import bftsmart.tom.core.messages.TOMMessage;
import bftsmart.tom.core.messages.TOMMessageType;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import java.nio.charset.StandardCharsets;

class FrontEndEventHandler extends SimpleChannelInboundHandler<String> {

    AsynchServiceProxy serviceProxy;

    public FrontEndEventHandler(AsynchServiceProxy serviceProxy) {
        this.serviceProxy = serviceProxy;
    }

@Override
protected void channelRead0(ChannelHandlerContext ctx, String msg) {
    try {
        System.out.println("🔹 Received from TCP: " + msg);
        byte[] result = serviceProxy.invokeOrdered(msg.getBytes(StandardCharsets.UTF_8));

        if (result != null) {
            String response = new String(result, StandardCharsets.UTF_8);
            System.out.println("✅ BFT Response: " + response);
            ctx.writeAndFlush(response + "\n");  // echo response
        } else {
            System.out.println("⚠️ BFT Response is null (likely due to timeout)");
            ctx.writeAndFlush("⚠️ No reply from replicas (timeout)\n");
        }
    } catch (Exception e) {
        e.printStackTrace();
    }
}

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }

}
