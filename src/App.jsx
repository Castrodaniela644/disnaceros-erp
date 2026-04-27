import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const ENV_URL = import.meta.env.VITE_SUPABASE_URL || ''
const ENV_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export default function App() {
  const [sb] = useState(() => ENV_URL && ENV_KEY ? createClient(ENV_URL, ENV_KEY) : null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sb) { setLoading(false); return }
    sb.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [sb])

  if (loading) return <Splash msg="Cargando..."/>
  if (!sb) return <Splash msg="Configure VITE_SUPABASE_URL en Vercel"/>
  if (!session) return <Login sb={sb}/>
  return <Dashboard sb={sb} session={session}/>
}

function Splash({ msg }) {
  return (
    <div style={{minHeight:'100vh',background:'#1C1917',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{width:56,height:56,background:'#EA580C',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,marginBottom:16}}>⚡</div>
      <div style={{fontWeight:900,color:'#fff',fontSize:22,letterSpacing:2,marginBottom:6,textTransform:'uppercase'}}>DISNACEROS ERP</div>
      <div style={{color:'#78716C',fontSize:12,textTransform:'uppercase',letterSpacing:1}}>{msg}</div>
    </div>
  )
}

function Login({ sb }) {
  const [email, setEmail] = useState('admin@disnaceros.com')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const login = async () => {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass })
    if (error) setErr(error.message)
  }
  const s = (x) => ({ ...base, ...x })
  const base = { fontFamily: 'system-ui,sans-serif' }
  return (
    <div style={{minHeight:'100vh',background:'#1C1917',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
      <div style={{background:'#fff',borderRadius:10,padding:36,width:380,textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.4)'}}>
        <div style={{width:52,height:52,background:'#EA580C',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 14px'}}>⚡</div>
        <h2 style={{fontWeight:900,fontSize:20,marginBottom:4}}>DISNACEROS ERP</h2>
        <p style={{fontSize:11,color:'#a8a29e',marginBottom:22,textTransform:'uppercase',letterSpacing:1}}>Distribuidora Nacional de Aceros SAS</p>
        {err && <div style={{background:'#fee2e2',color:'#b91c1c',padding:'8px 12px',borderRadius:5,marginBottom:12,fontSize:12}}>{err}</div>}
        <input style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,marginBottom:10,fontSize:13,outline:'none'}} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/>
        <input style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e5e7eb',borderRadius:6,marginBottom:16,fontSize:13,outline:'none'}} type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/>
        <button onClick={login} style={{background:'#EA580C',color:'#fff',border:'none',borderRadius:6,padding:'11px 24px',fontWeight:700,cursor:'pointer',width:'100%',fontSize:14}}>Ingresar al Sistema</button>
      </div>
    </div>
  )
}

function Dashboard({ sb, session }) {
  const [mod, setMod] = useState('dash')
  const [profile, setProfile] = useState(null)
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])

  useEffect(() => {
    sb.from('profiles').select('*').eq('id', session.user.id).single().then(({data}) => setProfile(data))
    sb.from('ventas').select('*').limit(5).order('created_at',{ascending:false}).then(({data}) => setVentas(data||[]))
    sb.from('clientes').select('*').eq('activo',true).then(({data}) => setClientes(data||[]))
    sb.from('productos').select('*').eq('activo',true).then(({data}) => setProductos(data||[]))
  }, [sb, session])

  const rol = profile?.rol || 'sucursal'
  const fmtCOP = n => '$' + Math.round(n||0).toLocaleString('es-CO')

  const MODS = [
    {id:'dash',lbl:'Dashboard',ic:'📊'},
    {id:'ventas',lbl:'Ventas',ic:'🛒'},
    {id:'clientes',lbl:'Clientes',ic:'👥'},
    {id:'productos',lbl:'Productos',ic:'📦'},
    {id:'caja',lbl:'Diario Caja',ic:'💰'},
    {id:'cobrar',lbl:'Cuentas × Cobrar',ic:'💳'},
    {id:'reportes',lbl:'Reportes P&L',ic:'📈'},
    ...(rol==='admin'?[{id:'admin',lbl:'Administración',ic:'⚙'}]:[])
  ]

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'system-ui,sans-serif'}}>
      <aside style={{width:190,background:'#1C1917',display:'flex',flexDirection:'column',flexShrink:0,overflow:'hidden'}}>
        <div style={{padding:'12px 12px 8px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,background:'#EA580C',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>⚡</div>
            <div style={{fontWeight:900,color:'#fff',fontSize:14,letterSpacing:.5}}>DISNACEROS</div>
          </div>
          <div style={{fontSize:8,color:'#57534E',textTransform:'uppercase',letterSpacing:1,marginTop:5}}>ERP v3.0 · {rol.toUpperCase()}</div>
        </div>
        <nav style={{flex:1,padding:'8px 7px',overflowY:'auto'}}>
          {MODS.map(m=>(
            <button key={m.id} onClick={()=>setMod(m.id)}
              style={{display:'flex',alignItems:'center',gap:7,padding:'6px 8px',borderRadius:4,cursor:'pointer',marginBottom:1,color:mod===m.id?'#fff':'#78716C',fontSize:11,fontWeight:600,border:'none',background:mod===m.id?'#EA580C':'none',width:'100%',textAlign:'left'}}>
              <span style={{fontSize:13}}>{m.ic}</span>{m.lbl}
            </button>
          ))}
        </nav>
        <div style={{padding:'7px',borderTop:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,padding:'4px 7px',marginBottom:4}}>
            <div style={{width:24,height:24,borderRadius:'50%',background:'#EA580C',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9,fontWeight:800,flexShrink:0}}>{(profile?.nombre||'U')[0]}</div>
            <div style={{overflow:'hidden'}}><div style={{fontSize:10,fontWeight:700,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.nombre||session.user.email}</div><div style={{fontSize:8,color:'#57534E',textTransform:'uppercase'}}>{rol}</div></div>
          </div>
          <button onClick={()=>sb.auth.signOut()} style={{background:'none',border:'none',color:'#57534E',fontSize:10,cursor:'pointer',padding:'3px 7px',width:'100%',textAlign:'left'}}>
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>
      <main style={{flex:1,background:'#F5F5F4',overflow:'auto',padding:14}}>
        {mod==='dash' && (
          <div>
            <div style={{marginBottom:12}}>
              <h1 style={{fontWeight:900,fontSize:18,color:'#1C1917',textTransform:'uppercase',letterSpacing:.5}}>Dashboard General</h1>
              <p style={{fontSize:11,color:'#78716C',marginTop:2}}>DISNACEROS · NIT 832002886-6 · Soacha Cundinamarca</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:9,marginBottom:14}}>
              {[
                {ic:'🛒',lbl:'Ventas',val:ventas.length,c:'#EA580C'},
                {ic:'👥',lbl:'Clientes',val:clientes.length,c:'#0ea5e9'},
                {ic:'📦',lbl:'Productos',val:productos.length,c:'#7c3aed'},
                {ic:'⚠',lbl:'Stock bajo',val:productos.filter(p=>p.stock<=p.stock_minimo).length,c:'#dc2626'},
              ].map(k=>(
                <div key={k.lbl} style={{background:'#fff',borderRadius:7,padding:'11px 13px',border:'1px solid #E7E5E4',borderLeft:'3px solid '+k.c}}>
                  <div style={{fontSize:18,marginBottom:6}}>{k.ic}</div>
                  <div style={{fontSize:9,fontWeight:700,color:'#78716C',textTransform:'uppercase',letterSpacing:.5,marginBottom:2}}>{k.lbl}</div>
                  <div style={{fontSize:22,fontWeight:900,color:'#1C1917'}}>{k.val}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:7,border:'1px solid #E7E5E4',overflow:'hidden'}}>
              <div style={{padding:'8px 13px',background:'#F5F5F4',borderBottom:'1px solid #E7E5E4',fontWeight:800,fontSize:12,color:'#1C1917',textTransform:'uppercase',letterSpacing:.4}}>Últimas Ventas</div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr>{['#','Cliente','Tipo','Total','Estado'].map(h=><th key={h} style={{padding:'6px 11px',textAlign:'left',fontSize:9,fontWeight:700,color:'#78716C',textTransform:'uppercase',borderBottom:'1px solid #E7E5E4',background:'#F5F5F4'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {ventas.map(v=>(
                    <tr key={v.id}>
                      <td style={{padding:'7px 11px',fontSize:11,fontWeight:700,color:'#EA580C',fontFamily:'monospace'}}>{v.id||v.folio}</td>
                      <td style={{padding:'7px 11px',fontSize:11}}>{v.cliente_nombre||v.cliente||'-'}</td>
                      <td style={{padding:'7px 11px'}}><span style={{background:'#FFEDD5',color:'#C2410C',padding:'1px 6px',borderRadius:3,fontSize:9,fontWeight:700}}>{v.tipo||v.type||'-'}</span></td>
                      <td style={{padding:'7px 11px',fontSize:11,fontWeight:700}}>{fmtCOP(v.total)}</td>
                      <td style={{padding:'7px 11px'}}><span style={{background:'#dcfce7',color:'#15803d',padding:'1px 6px',borderRadius:3,fontSize:9,fontWeight:700}}>{v.estado||v.status||'-'}</span></td>
                    </tr>
                  ))}
                  {ventas.length===0 && <tr><td colSpan={5} style={{padding:20,textAlign:'center',color:'#A8A29E',fontSize:12}}>Sin ventas aún — Usa el módulo Ventas para crear la primera</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {mod!=='dash' && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'70vh',color:'#A8A29E',textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>{MODS.find(m=>m.id===mod)?.ic||'📊'}</div>
            <div style={{fontWeight:900,fontSize:16,color:'#1C1917',textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>{MODS.find(m=>m.id===mod)?.lbl}</div>
            <div style={{fontSize:13,lineHeight:1.6,maxWidth:320}}>
              Módulo completo disponible en el ERP v3 completo.<br/>
              <span style={{color:'#EA580C',fontWeight:700}}>Sube el archivo src/App.jsx completo</span><br/>
              del ZIP descargado para activar todos los módulos.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}