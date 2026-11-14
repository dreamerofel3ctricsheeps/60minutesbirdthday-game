import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
import os
SRC=os.environ.get('DRAFTS', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'drafts', 'v1.2'))+'/'
NAMES=['Alan','Fatima','Itzel','Jose','Majo','Natalia','Samantha','Saulo','Ximena']
CLOSE={'Natalia':6}
def cutout(name, N=256):
    im=Image.open(SRC+name+'.jpg').convert('RGB')
    a=np.asarray(im).astype(np.int16)
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1)
    c=a[4:200,4:200].reshape(-1,3).max(1); h=np.bincount(c,minlength=256)
    dm=int(np.argmax(h[:90])); lm=90+int(np.argmax(h[90:]))      # tonos oscuro y claro del damero
    neu=(mx-mn)<12
    dt=min(6,dm-12)
    strict=neu&((np.abs(mx-dm)<=dt)|(np.abs(mx-lm)<=8))        # sólo los dos tonos del damero (el contorno negro y la ropa quedan fuera)
    bgl=ndi.binary_dilation(strict,iterations=2)               # une las casillas a través del borde difuminado
    lab,n=ndi.label(bgl)
    border=np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]]))
    bg=np.isin(lab,border[border>0])
    bg=ndi.binary_dilation(bg,iterations=2)
    if CLOSE.get(name): bg=ndi.binary_closing(bg,iterations=CLOSE[name])   # quita restos de la rejilla del damero pegados al contorno
    fg=~bg
    # quedarse con el componente mayor (el personaje)
    l2,n2=ndi.label(fg); sizes=ndi.sum(fg,l2,range(1,n2+1)); fg=l2==(1+int(np.argmax(sizes)))
    fg=ndi.binary_fill_holes(fg)
    # casillas negras del damero pegadas al contorno: salientes casi totalmente negros/grises
    core=ndi.binary_opening(fg,structure=np.ones((3,3)),iterations=9)
    lab3,n3=ndi.label(fg&~core); junk=(mx<26)|(((mx-mn)<12)&(np.abs(mx-lm)<=10))
    if n3:
        tot=ndi.sum(np.ones_like(fg),lab3,range(1,n3+1)); jk=ndi.sum(junk,lab3,range(1,n3+1))
        cl,_=ndi.label(core); bad=[]
        for i in 1+np.where((jk>=0.72*tot)&(tot>150)&(tot<6000))[0]:
            sl=ndi.find_objects((lab3==i).astype(np.uint8))[0]; sl=tuple(slice(max(0,q.start-4),q.stop+4) for q in sl)
            touch=np.unique(cl[sl][ndi.binary_dilation(lab3[sl]==i,iterations=3)])
            if (touch>0).sum()<=1: bad.append(i)                 # no es un puente entre dos partes del cuerpo
        fg&=~np.isin(lab3,bad)
        l2,n2=ndi.label(fg); sizes=ndi.sum(fg,l2,range(1,n2+1)); fg=l2==(1+int(np.argmax(sizes)))
    rgba=np.dstack([np.asarray(im),(fg*255).astype(np.uint8)])
    big=Image.fromarray(rgba,'RGBA')
    # reducir a la rejilla nativa del pixel art (premultiplicado)
    f=np.asarray(big).astype(np.float32); al=f[...,3:4]/255; pm=np.dstack([f[...,:3]*al,f[...,3]])
    k=8; H,W=pm.shape[:2]; H2,W2=H//k*k,W//k*k
    pm=pm[:H2,:W2].reshape(H2//k,k,W2//k,k,4).mean((1,3)); al=pm[...,3:4]
    rgb=np.where(al>0,pm[...,:3]/np.maximum(al/255,1e-6),0)
    out=np.dstack([np.clip(rgb,0,255),np.where(al>127,255,0)]).astype(np.uint8)
    return out
if __name__=='__main__':
    sheet=Image.new('RGBA',(300*5,300*2),(90,110,130,255))
    for i,n in enumerate(NAMES):
        o=cutout(n); np.save(f'/tmp/sp/{n}.npy',o)
        im=Image.fromarray(o,'RGBA'); sheet.alpha_composite(im,((i%5)*300,(i//5)*300))
        ys,xs=np.where(o[...,3]>0); print(n,o.shape,xs.min(),xs.max(),ys.min(),ys.max())
    sheet.save('/tmp/sp/cut.png')
